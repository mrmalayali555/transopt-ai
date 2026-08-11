// =============================================================================
// TRANSOPT AI — Disruption Engine
// Handles unexpected events and generates crisis responses
// =============================================================================

import type {
  Bus,
  Route,
  Stop,
  SimulationEvent,
  Disruption,
  DisruptionAction,
  Weather,
} from '@/lib/types';
import { generateId, SeededRandom } from '@/lib/utils';

const rng = new SeededRandom(789);

/**
 * Process an event and create a disruption response.
 */
export function processDisruption(
  event: SimulationEvent,
  buses: Bus[],
  routes: Route[],
  stops: Stop[],
  weather: Weather
): Disruption {
  // 1. Identify affected routes and buses
  const affectedRouteIds = event.affectedRoutes.length > 0
    ? event.affectedRoutes
    : routes
        .filter(() => rng.next() < 0.3) // ~30% of routes affected if not specified
        .map(r => r.id);

  const affectedBuses = buses.filter(
    b => b.assignedRouteId && affectedRouteIds.includes(b.assignedRouteId) && b.status === 'in-service'
  );

  // 2. Estimate affected passengers
  const affectedPassengers = affectedBuses.reduce((sum, b) => sum + b.currentPassengers, 0) +
    Math.round(affectedBuses.length * 30 * event.demandMultiplier); // waiting passengers

  // 3. Find alternative routes
  const alternativeRoutes = routes
    .filter(r => !affectedRouteIds.includes(r.id))
    .filter(r => {
      // Check if route connects any of the affected stops
      const affectedStopIds = new Set(event.affectedStops);
      return r.stops.some(s => affectedStopIds.has(s)) || rng.next() < 0.2;
    })
    .slice(0, 5)
    .map(r => r.id);

  // 4. Generate recommended actions
  const actions: DisruptionAction[] = [];

  // Reroute
  if (alternativeRoutes.length > 0) {
    actions.push({
      id: generateId('action'),
      type: 'reroute',
      description: `Reroute affected buses via ${alternativeRoutes.length} alternative routes`,
      estimatedImpact: {
        passengersSaved: Math.round(affectedPassengers * 0.6),
        delayReduction: rng.nextInt(5, 15),
        additionalCost: rng.nextInt(2000, 8000),
      },
      priority: 1,
    });
  }

  // Add standby buses
  const standbyBuses = buses.filter(b => b.status === 'standby' || b.status === 'idle');
  if (standbyBuses.length > 0) {
    actions.push({
      id: generateId('action'),
      type: 'add-bus',
      description: `Deploy ${Math.min(standbyBuses.length, 5)} standby buses to affected routes`,
      estimatedImpact: {
        passengersSaved: Math.round(affectedPassengers * 0.4),
        delayReduction: rng.nextInt(8, 20),
        additionalCost: rng.nextInt(5000, 15000),
      },
      priority: 2,
    });
  }

  // Reassign from low-demand routes
  const lowDemandBuses = buses.filter(
    b => b.assignedRouteId &&
      !affectedRouteIds.includes(b.assignedRouteId) &&
      b.currentPassengers < b.capacity * 0.3 &&
      b.status === 'in-service'
  );
  if (lowDemandBuses.length > 0) {
    actions.push({
      id: generateId('action'),
      type: 'reassign',
      description: `Reassign ${Math.min(lowDemandBuses.length, 3)} underutilized buses to affected routes`,
      estimatedImpact: {
        passengersSaved: Math.round(affectedPassengers * 0.35),
        delayReduction: rng.nextInt(4, 12),
        additionalCost: rng.nextInt(1000, 4000),
      },
      priority: 3,
    });
  }

  // Increase frequency on alternatives
  if (alternativeRoutes.length > 0) {
    actions.push({
      id: generateId('action'),
      type: 'increase-frequency',
      description: 'Increase frequency on alternative routes to absorb displaced passengers',
      estimatedImpact: {
        passengersSaved: Math.round(affectedPassengers * 0.5),
        delayReduction: rng.nextInt(6, 18),
        additionalCost: rng.nextInt(6000, 12000),
      },
      priority: 4,
    });
  }

  // Sort by priority
  actions.sort((a, b) => a.priority - b.priority);

  return {
    id: generateId('disruption'),
    event,
    affectedPassengers,
    affectedBuses: affectedBuses.map(b => b.id),
    alternativeRoutes,
    recommendedActions: actions,
    status: 'detected',
  };
}

/**
 * Generate crisis-mode response with changed priorities.
 */
export function generateCrisisResponse(
  disruption: Disruption,
  buses: Bus[],
  routes: Route[],
  stops: Stop[]
): DisruptionAction[] {
  const crisisActions: DisruptionAction[] = [];

  // Priority 1: Evacuate passengers from danger zones
  crisisActions.push({
    id: generateId('crisis'),
    type: 'reroute',
    description: 'PRIORITY: Evacuate passengers from affected areas to safe zones',
    estimatedImpact: {
      passengersSaved: disruption.affectedPassengers,
      delayReduction: 0, // delay not primary concern
      additionalCost: 0, // cost not primary concern
    },
    priority: 1,
  });

  // Priority 2: Ensure hospital/emergency connectivity
  crisisActions.push({
    id: generateId('crisis'),
    type: 'add-bus',
    description: 'Ensure transport connectivity to hospitals and emergency services',
    estimatedImpact: {
      passengersSaved: Math.round(disruption.affectedPassengers * 0.3),
      delayReduction: 5,
      additionalCost: rng.nextInt(5000, 10000),
    },
    priority: 2,
  });

  // Priority 3: Prevent isolation of remote areas
  crisisActions.push({
    id: generateId('crisis'),
    type: 'reassign',
    description: 'Reassign buses to prevent isolation of rural/remote areas',
    estimatedImpact: {
      passengersSaved: Math.round(disruption.affectedPassengers * 0.2),
      delayReduction: 3,
      additionalCost: rng.nextInt(3000, 8000),
    },
    priority: 3,
  });

  return crisisActions;
}
