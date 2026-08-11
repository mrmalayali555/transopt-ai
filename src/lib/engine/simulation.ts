// =============================================================================
// TRANSOPT AI — Digital Twin / Simulation Engine
// Core simulation loop that drives the entire platform
// =============================================================================

import type {
  Bus,
  Route,
  Stop,
  Driver,
  Weather,
  SimulationEvent,
  SimulationState,
  NetworkMetrics,
  Recommendation,
  Connection,
  MaintenancePrediction,
} from '@/lib/types';
import { buildKeralaNetwork } from '@/lib/data/kerala-network';
import { predictDemand, predictDelay, predictOccupancy } from './predictor';
import { optimizeFleet } from './optimizer';
import { detectMissedConnections } from './connection';
import { processDisruption } from './disruption';
import { calculateNetworkScore, getHealthLabel } from './scoring';
import { SeededRandom, clamp, interpolateCoords, generateId } from '@/lib/utils';
import { HOURLY_DEMAND_PATTERN, EVENT_PRESETS } from '@/lib/constants';

const rng = new SeededRandom(999);

// ---- Singleton simulation state ----

let networkData: {
  stops: Stop[];
  routes: Route[];
  buses: Bus[];
  drivers: Driver[];
} | null = null;

export function getNetworkData() {
  if (!networkData) {
    networkData = buildKeralaNetwork();
  }
  return networkData;
}

export function resetNetworkData() {
  networkData = null;
}

/**
 * Advance the simulation by one tick.
 * Returns updated state.
 */
export function simulationTick(
  state: SimulationState,
  buses: Bus[],
  routes: Route[],
  stops: Stop[],
  drivers: Driver[]
): {
  buses: Bus[];
  metrics: NetworkMetrics;
  recommendations: Recommendation[];
  connections: Connection[];
} {
  const hour = Math.floor(state.currentTime / 60);
  const demandFactor = HOURLY_DEMAND_PATTERN[hour % 24];

  // 1. Move buses along routes
  const updatedBuses = buses.map(bus => {
    if (bus.status !== 'in-service' && bus.status !== 'at-stop') return bus;

    const route = routes.find(r => r.id === bus.assignedRouteId);
    if (!route || route.stops.length === 0) return bus;

    const updated = { ...bus };

    // Progress along route
    if (updated.currentStopIndex < route.stops.length - 1) {
      const fromStop = stops.find(s => s.id === route.stops[updated.currentStopIndex]);
      const toStop = stops.find(s => s.id === route.stops[updated.nextStopIndex]);

      if (fromStop && toStop) {
        // Move toward next stop
        const progress = rng.nextFloat(0.3, 0.8); // Per-tick progress
        updated.currentPosition = interpolateCoords(
          fromStop.coordinates,
          toStop.coordinates,
          progress
        );

        // Randomly arrive at next stop
        if (rng.next() > 0.5) {
          // Simulate boarding/alighting
          const boarding = Math.round(
            (toStop.avgDailyPassengers / 16) * demandFactor * rng.nextFloat(0.5, 1.5) *
            state.weather.demandMultiplier
          );
          const alighting = Math.round(updated.currentPassengers * rng.nextFloat(0.05, 0.25));

          updated.currentPassengers = clamp(
            updated.currentPassengers + boarding - alighting,
            0,
            updated.capacity
          );
          updated.currentStopIndex = updated.nextStopIndex;
          updated.nextStopIndex = Math.min(updated.nextStopIndex + 1, route.stops.length - 1);
          updated.status = 'at-stop';
          updated.currentPosition = toStop.coordinates;
        } else {
          updated.status = 'in-service';
        }
      }
    } else {
      // Reached end of route, reset to start
      updated.currentStopIndex = 0;
      updated.nextStopIndex = 1;
      const firstStop = stops.find(s => s.id === route.stops[0]);
      if (firstStop) {
        updated.currentPosition = firstStop.coordinates;
      }
      updated.currentPassengers = Math.round(updated.capacity * rng.nextFloat(0.1, 0.4));
    }

    // Apply event effects
    state.activeEvents.forEach(event => {
      if (event.affectedRoutes.includes(route.id)) {
        updated.delayMinutes = clamp(
          updated.delayMinutes + rng.nextFloat(0, event.delayMultiplier - 1) * 2,
          0,
          60
        );
        // Demand surge passengers
        if (event.demandMultiplier > 1) {
          const extraPassengers = Math.round(
            (event.demandMultiplier - 1) * updated.currentPassengers * 0.3
          );
          updated.currentPassengers = clamp(
            updated.currentPassengers + extraPassengers,
            0,
            Math.round(updated.capacity * 1.2) // Allow slight overcrowding
          );
        }
      }
    });

    // Weather delay
    updated.delayMinutes = clamp(
      updated.delayMinutes + (state.weather.delayMultiplier - 1) * rng.nextFloat(0, 1),
      0,
      60
    );

    // Slow delay decay
    if (updated.delayMinutes > 0 && rng.next() > 0.7) {
      updated.delayMinutes = Math.max(0, updated.delayMinutes - 0.5);
    }

    return updated;
  });

  // 2. Calculate network metrics
  const activeBuses = updatedBuses.filter(b => b.status === 'in-service' || b.status === 'at-stop');
  const totalPassengers = activeBuses.reduce((sum, b) => sum + b.currentPassengers, 0);
  const totalCapacity = activeBuses.reduce((sum, b) => sum + b.capacity, 0);
  const avgOccupancy = totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;
  const delayedBuses = activeBuses.filter(b => b.delayMinutes > 3).length;
  const overcrowded = activeBuses.filter(b => b.currentPassengers > b.capacity * 0.85).length;

  // Base waiting time depends on frequency and number of active buses
  const baseWaiting = 15 - (activeBuses.length / routes.length) * 3;
  const eventWaiting = state.activeEvents.reduce((sum, e) => sum + (e.delayMultiplier - 1) * 4, 0);
  const avgWaiting = clamp(baseWaiting + eventWaiting + (delayedBuses / Math.max(1, activeBuses.length)) * 5, 3, 40);

  const missedConnections = Math.round(
    delayedBuses * rng.nextFloat(0.5, 2.0) *
    (state.activeEvents.length > 0 ? 1.5 : 1.0)
  );

  const operatingCost = activeBuses.length * 850 + // base cost per bus per day (proportional)
    (state.currentTime / 1440) * activeBuses.length * 200; // time-based

  const fleetUtil = (activeBuses.length / Math.max(1, updatedBuses.length)) * 100;
  const onTime = ((activeBuses.length - delayedBuses) / Math.max(1, activeBuses.length)) * 100;

  const metrics: NetworkMetrics = {
    activeBuses: activeBuses.length,
    totalBuses: updatedBuses.length,
    delayedBuses,
    totalPassengerDemand: totalPassengers,
    avgWaitingTime: Math.round(avgWaiting * 10) / 10,
    avgOccupancy: Math.round(avgOccupancy * 10) / 10,
    overcrowdedServices: overcrowded,
    missedConnections: clamp(missedConnections, 0, 50),
    estimatedOperatingCost: Math.round(operatingCost),
    fleetUtilization: Math.round(fleetUtil * 10) / 10,
    networkHealthScore: 0, // calculated below
    networkHealthLabel: '',
    onTimePerformance: Math.round(onTime * 10) / 10,
    totalTrips: activeBuses.length * Math.ceil(state.currentTime / 120), // rough estimate
    completedTrips: Math.round(activeBuses.length * Math.ceil(state.currentTime / 120) * 0.85),
  };

  metrics.networkHealthScore = calculateNetworkScore(metrics, state.isCrisisMode);
  metrics.networkHealthLabel = getHealthLabel(metrics.networkHealthScore);

  // 3. Generate AI recommendations
  const recommendations: Recommendation[] = [];

  // Check for overcrowding
  if (overcrowded > 2) {
    const overcrowdedBus = activeBuses.find(b => b.currentPassengers > b.capacity * 0.90);
    const route = overcrowdedBus ? routes.find(r => r.id === overcrowdedBus.assignedRouteId) : null;

    recommendations.push({
      id: generateId('rec'),
      timestamp: state.currentTime,
      severity: 'critical',
      category: 'overcrowding',
      title: `${route?.shortName || 'Multiple routes'} predicted to exceed 95% capacity`,
      reason: `${overcrowded} services currently above 85% occupancy`,
      dataUsed: ['Real-time bus occupancy', 'Demand prediction model', 'Weather conditions'],
      expectedImpact: `${Math.round(overcrowded * 30)} passengers affected`,
      confidence: 0.89,
      recommendedAction: 'Reassign underutilized bus or deploy standby',
      strategies: [],
      status: 'pending',
    });
  }

  // Check for delays
  if (delayedBuses > activeBuses.length * 0.3) {
    recommendations.push({
      id: generateId('rec'),
      timestamp: state.currentTime,
      severity: 'warning',
      category: 'delay',
      title: `${delayedBuses} buses experiencing significant delays`,
      reason: `${Math.round((delayedBuses / activeBuses.length) * 100)}% of fleet delayed`,
      dataUsed: ['Bus position tracking', 'Schedule comparison', 'Traffic conditions'],
      expectedImpact: `Average delay: ${Math.round(activeBuses.reduce((s, b) => s + b.delayMinutes, 0) / Math.max(1, delayedBuses))} min`,
      confidence: 0.92,
      recommendedAction: 'Adjust schedules and notify passengers',
      strategies: [],
      status: 'pending',
    });
  }

  // Connection check
  const connections = detectMissedConnections(updatedBuses, routes, stops, state.currentTime);
  if (connections.length > 0) {
    const topConn = connections[0];
    recommendations.push({
      id: generateId('rec'),
      timestamp: state.currentTime,
      severity: topConn.missedProbability > 0.7 ? 'critical' : 'warning',
      category: 'connection',
      title: `${topConn.transferringPassengers} passengers may miss connection at ${stops.find(s => s.id === topConn.transferStopId)?.name || 'transfer stop'}`,
      reason: `${topConn.fromBusId} arriving ${Math.round(-topConn.bufferMinutes)} min late`,
      dataUsed: ['Bus ETAs', 'Transfer schedule', 'Passenger count'],
      expectedImpact: `${topConn.transferringPassengers} passengers affected`,
      confidence: topConn.missedProbability,
      recommendedAction: `Hold ${topConn.toBusId} for ${Math.ceil(-topConn.bufferMinutes + 1)} minutes`,
      strategies: [],
      status: 'pending',
    });
  }

  return {
    buses: updatedBuses,
    metrics,
    recommendations,
    connections,
  };
}

/**
 * Inject an event into the simulation.
 */
export function createEventFromPreset(
  presetIndex: number,
  routes: Route[],
  stops: Stop[],
  currentTime: number
): SimulationEvent {
  const preset = EVENT_PRESETS[presetIndex] || EVENT_PRESETS[0];

  // Affect 20-40% of routes
  const affectedRoutes = routes
    .filter(() => rng.next() < 0.35)
    .map(r => r.id);

  const affectedStops = stops
    .filter(s => affectedRoutes.some(rId => s.connectedRoutes.includes(rId)))
    .slice(0, 15)
    .map(s => s.id);

  return {
    id: generateId('event'),
    type: preset.type,
    title: preset.title,
    description: preset.description,
    severity: preset.severity,
    affectedRoutes,
    affectedStops,
    startTime: currentTime,
    endTime: null,
    demandMultiplier: preset.demandMultiplier,
    delayMultiplier: preset.delayMultiplier,
    capacityMultiplier: preset.capacityMultiplier,
    isActive: true,
    icon: preset.icon,
  };
}

/**
 * Generate predictive maintenance scores for all buses.
 */
export function generateMaintenancePredictions(buses: Bus[]): MaintenancePrediction[] {
  return buses.map(bus => {
    // Risk factors
    const ageFactor = clamp(bus.age / 15, 0, 1) * 30;
    const mileageFactor = clamp(bus.mileage / 300000, 0, 1) * 25;
    const conditionFactor = bus.condition === 'poor' ? 25 : bus.condition === 'fair' ? 15 : bus.condition === 'good' ? 5 : 0;
    const maintenanceFactor = (100 - bus.maintenanceScore) * 0.2;

    const riskScore = clamp(Math.round(ageFactor + mileageFactor + conditionFactor + maintenanceFactor), 0, 100);
    const riskLevel: MaintenancePrediction['riskLevel'] =
      riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

    return {
      busId: bus.id,
      riskScore,
      riskLevel,
      factors: [
        { name: 'Vehicle Age', value: bus.age, weight: 0.3, description: `${bus.age} years old` },
        { name: 'Mileage', value: bus.mileage, weight: 0.25, description: `${bus.mileage.toLocaleString()} km` },
        { name: 'Condition', value: conditionFactor, weight: 0.25, description: `Current: ${bus.condition}` },
        { name: 'Maintenance Score', value: bus.maintenanceScore, weight: 0.2, description: `Score: ${bus.maintenanceScore}/100` },
      ],
      nextScheduledDate: '2026-09-01',
      recommendedAction: riskLevel === 'high'
        ? 'Immediate inspection recommended — schedule maintenance within 48 hours'
        : riskLevel === 'medium'
          ? 'Monitor closely — schedule preventive maintenance within 2 weeks'
          : 'Normal operation — continue routine maintenance schedule',
    };
  });
}

/**
 * Detect bus bunching on a route.
 */
export function detectBusBunching(
  buses: Bus[],
  routes: Route[],
  currentTime: number
): Array<{ routeId: string; routeName: string; isBunched: boolean; buses: Array<{ id: string; position: number }>; recommendation: string }> {
  const results: Array<{ routeId: string; routeName: string; isBunched: boolean; buses: Array<{ id: string; position: number }>; recommendation: string }> = [];

  routes.forEach(route => {
    const routeBuses = buses
      .filter(b => b.assignedRouteId === route.id && (b.status === 'in-service' || b.status === 'at-stop'))
      .sort((a, b) => a.currentStopIndex - b.currentStopIndex);

    if (routeBuses.length < 2) return;

    let isBunched = false;
    for (let i = 1; i < routeBuses.length; i++) {
      const gap = Math.abs(routeBuses[i].currentStopIndex - routeBuses[i - 1].currentStopIndex);
      if (gap <= 1) {
        isBunched = true;
        break;
      }
    }

    results.push({
      routeId: route.id,
      routeName: route.shortName,
      isBunched,
      buses: routeBuses.map(b => ({ id: b.id, position: b.currentStopIndex })),
      recommendation: isBunched
        ? `Hold trailing bus for 3-5 minutes to restore spacing on ${route.shortName}`
        : 'Normal spacing — no action needed',
    });
  });

  return results;
}
