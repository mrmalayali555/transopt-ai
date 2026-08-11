// =============================================================================
// TRANSOPT AI — Connection Optimization Engine
// Predicts missed connections & evaluates hold/don't-hold decisions
// =============================================================================

import type {
  Bus,
  Route,
  Stop,
  Connection,
  ConnectionIntervention,
} from '@/lib/types';
import { generateId, clamp } from '@/lib/utils';

/**
 * Detect potential missed connections at transfer points.
 */
export function detectMissedConnections(
  buses: Bus[],
  routes: Route[],
  stops: Stop[],
  currentTime: number
): Connection[] {
  const connections: Connection[] = [];
  const transferStops = stops.filter(s => s.isTransferPoint);

  for (const stop of transferStops) {
    // Find buses approaching this stop
    const approachingBuses = buses.filter(b => {
      if (!b.assignedRouteId || b.status === 'idle' || b.status === 'standby') return false;
      const route = routes.find(r => r.id === b.assignedRouteId);
      if (!route) return false;
      const stopIdx = route.stops.indexOf(stop.id);
      return stopIdx >= 0 && stopIdx > b.currentStopIndex && stopIdx <= b.currentStopIndex + 3;
    });

    // Find buses departing from this stop
    const departingBuses = buses.filter(b => {
      if (!b.assignedRouteId || b.status === 'idle') return false;
      const route = routes.find(r => r.id === b.assignedRouteId);
      if (!route) return false;
      return route.stops[b.currentStopIndex] === stop.id && b.status === 'at-stop';
    });

    // Check each arriving-departing pair
    for (const arriving of approachingBuses) {
      for (const departing of departingBuses) {
        if (arriving.assignedRouteId === departing.assignedRouteId) continue;

        const arrivingRoute = routes.find(r => r.id === arriving.assignedRouteId)!;
        const stopIdxInRoute = arrivingRoute.stops.indexOf(stop.id);
        const stopsAway = stopIdxInRoute - arriving.currentStopIndex;
        const etaMinutes = stopsAway * 3 + arriving.delayMinutes; // ~3 min per stop
        const arrivalTime = currentTime + etaMinutes;

        const scheduledDeparture = currentTime + 2; // departing bus leaves in ~2 min
        const buffer = scheduledDeparture - arrivalTime;
        const transferPassengers = Math.round(arriving.currentPassengers * 0.15); // ~15% transfer

        const missedProb = buffer < 0 ? 0.95 :
          buffer < 1 ? 0.70 :
          buffer < 2 ? 0.40 :
          buffer < 3 ? 0.15 : 0.05;

        if (missedProb > 0.10 && transferPassengers > 5) {
          connections.push({
            id: generateId('conn'),
            fromBusId: arriving.id,
            fromRouteId: arriving.assignedRouteId!,
            toBusId: departing.id,
            toRouteId: departing.assignedRouteId!,
            transferStopId: stop.id,
            fromETA: arrivalTime,
            toScheduledDeparture: scheduledDeparture,
            transferringPassengers: transferPassengers,
            status: missedProb > 0.6 ? 'at-risk' : missedProb > 0.3 ? 'at-risk' : 'safe',
            bufferMinutes: buffer,
            missedProbability: missedProb,
          });
        }
      }
    }
  }

  return connections.sort((a, b) => b.missedProbability - a.missedProbability);
}

/**
 * Evaluate interventions for a missed connection.
 */
export function evaluateConnectionInterventions(
  connection: Connection,
  buses: Bus[],
  routes: Route[],
  stops: Stop[]
): ConnectionIntervention[] {
  const interventions: ConnectionIntervention[] = [];
  const departingBus = buses.find(b => b.id === connection.toBusId);
  if (!departingBus) return interventions;

  const holdMinutes = Math.max(1, Math.ceil(-connection.bufferMinutes) + 1);

  // === Option A: Hold departing bus ===
  const holdPassengersSaved = connection.transferringPassengers;
  const holdPassengersDelayed = departingBus.currentPassengers;
  const holdTotalDelay = holdPassengersDelayed * holdMinutes;

  interventions.push({
    id: generateId('interv'),
    connectionId: connection.id,
    type: 'hold',
    description: `Hold ${connection.toBusId} for ${holdMinutes} minutes`,
    passengersSaved: holdPassengersSaved,
    passengersDelayed: holdPassengersDelayed,
    totalDelayMinutes: holdTotalDelay,
    score: holdPassengersSaved * 10 - holdTotalDelay * 0.5,
  });

  // === Option B: Don't hold ===
  interventions.push({
    id: generateId('interv'),
    connectionId: connection.id,
    type: 'dont-hold',
    description: `Don't hold ${connection.toBusId} — ${connection.transferringPassengers} passengers wait for next service`,
    passengersSaved: 0,
    passengersDelayed: 0,
    totalDelayMinutes: connection.transferringPassengers * 15, // avg 15 min wait for next
    score: -(connection.transferringPassengers * 15 * 0.5),
  });

  // === Option C: Redirect to alternative ===
  const alternativeBuses = buses.filter(b =>
    b.id !== connection.toBusId &&
    b.assignedRouteId !== connection.toRouteId &&
    b.status === 'in-service' &&
    b.currentPassengers < b.capacity * 0.7
  );

  if (alternativeBuses.length > 0) {
    const altBus = alternativeBuses[0];
    const redirectDelay = 8; // average redirect adds ~8 min
    interventions.push({
      id: generateId('interv'),
      connectionId: connection.id,
      type: 'redirect',
      description: `Redirect ${connection.transferringPassengers} passengers to ${altBus.id} (${routes.find(r => r.id === altBus.assignedRouteId)?.shortName || 'alternate route'})`,
      passengersSaved: Math.round(connection.transferringPassengers * 0.7),
      passengersDelayed: 0,
      totalDelayMinutes: connection.transferringPassengers * redirectDelay,
      score: connection.transferringPassengers * 0.7 * 10 - connection.transferringPassengers * redirectDelay * 0.3,
    });
  }

  return interventions.sort((a, b) => b.score - a.score);
}
