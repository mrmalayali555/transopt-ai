// =============================================================================
// TRANSOPT AI — Fleet Optimization Engine
// Constraint-based heuristic solver for bus allocation
// =============================================================================

import type {
  Bus,
  Route,
  Stop,
  Driver,
  Weather,
  SimulationEvent,
  OptimizationStrategy,
  StrategyChange,
  StrategyMetrics,
  NetworkMetrics,
} from '@/lib/types';
import { predictDemand } from './predictor';
import { calculateObjective, scoreStrategy } from './scoring';
import { SeededRandom, clamp, generateId } from '@/lib/utils';
import { DEFAULT_WEIGHTS } from '@/lib/constants';

const rng = new SeededRandom(456);

interface OptimizationInput {
  buses: Bus[];
  routes: Route[];
  stops: Stop[];
  drivers: Driver[];
  weather: Weather;
  activeEvents: SimulationEvent[];
  currentTime: number;
  dayOfWeek: number;
  currentMetrics: NetworkMetrics;
}

/**
 * Main optimization function.
 * Generates and evaluates multiple strategies, returns ranked list.
 */
export function optimizeFleet(input: OptimizationInput): OptimizationStrategy[] {
  const {
    buses, routes, stops, drivers, weather,
    activeEvents, currentTime, dayOfWeek, currentMetrics,
  } = input;

  const strategies: OptimizationStrategy[] = [];
  const hour = Math.floor(currentTime / 60);

  // Find overcrowded and underutilized routes
  const routeMetrics = analyzeRouteUtilization(buses, routes, stops, hour, dayOfWeek, weather, activeEvents);
  const overcrowded = routeMetrics.filter(r => r.avgOccupancy > 85);
  const underutilized = routeMetrics.filter(r => r.avgOccupancy < 40);
  const standbyBuses = buses.filter(b => b.status === 'standby' || b.status === 'idle');
  const availableDrivers = drivers.filter(d => d.status === 'on-duty' && !d.assignedBusId);

  // Baseline objective
  const baselineObj = calculateObjective(
    currentMetrics.avgWaitingTime,
    currentMetrics.avgOccupancy,
    currentMetrics.missedConnections,
    currentMetrics.estimatedOperatingCost,
    currentMetrics.delayedBuses * 3, // avg delay approx
    DEFAULT_WEIGHTS,
  );

  // === Strategy 1: Do Nothing ===
  strategies.push({
    id: generateId('strat'),
    name: 'Do Nothing',
    description: 'Maintain current operations without changes',
    type: 'do-nothing',
    changes: [],
    metrics: {
      waitingTimeChange: 0,
      occupancyAfter: currentMetrics.avgOccupancy,
      costChange: 0,
      overallScore: scoreStrategy(baselineObj, baselineObj),
      overcrowdedRoutes: overcrowded.length,
      missedConnections: currentMetrics.missedConnections,
      avgDelay: currentMetrics.delayedBuses * 3,
      fleetUtilization: currentMetrics.fleetUtilization,
    },
    score: scoreStrategy(baselineObj, baselineObj),
    isRecommended: false,
    reasoning: ['No changes to current operations', 'Risk of overcrowding on affected routes continues'],
    confidence: 1.0,
  });

  // === Strategy 2: Reassign Bus ===
  if (overcrowded.length > 0 && underutilized.length > 0) {
    const targetRoute = overcrowded[0];
    const sourceRoute = underutilized[0];
    const busToMove = buses.find(b => b.assignedRouteId === sourceRoute.routeId && b.status === 'in-service');

    if (busToMove) {
      const newOccupancy = clamp(targetRoute.avgOccupancy * 0.82, 40, 95);
      const waitingReduction = -rng.nextFloat(12, 20);
      const costIncrease = rng.nextInt(800, 2000);

      const reassignObj = calculateObjective(
        currentMetrics.avgWaitingTime * (1 + waitingReduction / 100),
        newOccupancy,
        Math.max(0, currentMetrics.missedConnections - rng.nextInt(3, 8)),
        currentMetrics.estimatedOperatingCost + costIncrease,
        Math.max(0, currentMetrics.delayedBuses * 3 - 2),
        DEFAULT_WEIGHTS,
      );

      strategies.push({
        id: generateId('strat'),
        name: `Reassign ${busToMove.id}`,
        description: `Move ${busToMove.id} from ${sourceRoute.routeName} to ${targetRoute.routeName}`,
        type: 'reassign',
        changes: [{
          busId: busToMove.id,
          fromRouteId: sourceRoute.routeId,
          toRouteId: targetRoute.routeId,
          action: 'reassign',
          detail: `Move from ${sourceRoute.routeName} (${Math.round(sourceRoute.avgOccupancy)}% occ.) to ${targetRoute.routeName} (${Math.round(targetRoute.avgOccupancy)}% occ.)`,
        }],
        metrics: {
          waitingTimeChange: waitingReduction,
          occupancyAfter: newOccupancy,
          costChange: costIncrease,
          overallScore: scoreStrategy(baselineObj, reassignObj),
          overcrowdedRoutes: Math.max(0, overcrowded.length - 1),
          missedConnections: Math.max(0, currentMetrics.missedConnections - rng.nextInt(3, 8)),
          avgDelay: Math.max(0, currentMetrics.delayedBuses * 3 - 2),
          fleetUtilization: clamp(currentMetrics.fleetUtilization + 3, 0, 100),
        },
        score: scoreStrategy(baselineObj, reassignObj),
        isRecommended: false,
        reasoning: [
          `${targetRoute.routeName} is at ${Math.round(targetRoute.avgOccupancy)}% occupancy`,
          `${sourceRoute.routeName} has only ${Math.round(sourceRoute.avgOccupancy)}% occupancy`,
          `Reassigning ${busToMove.id} balances load across routes`,
          `Expected waiting time reduction: ${Math.abs(waitingReduction).toFixed(1)}%`,
        ],
        confidence: 0.87,
      });
    }
  }

  // === Strategy 3: Add Bus from Standby ===
  if (overcrowded.length > 0 && standbyBuses.length > 0) {
    const targetRoute = overcrowded[0];
    const addBus = standbyBuses[0];
    const newOccupancy = clamp(targetRoute.avgOccupancy * 0.75, 35, 90);
    const waitingReduction = -rng.nextFloat(15, 25);
    const costIncrease = rng.nextInt(3000, 5000);

    const addBusObj = calculateObjective(
      currentMetrics.avgWaitingTime * (1 + waitingReduction / 100),
      newOccupancy,
      Math.max(0, currentMetrics.missedConnections - rng.nextInt(5, 12)),
      currentMetrics.estimatedOperatingCost + costIncrease,
      Math.max(0, currentMetrics.delayedBuses * 3 - 3),
      DEFAULT_WEIGHTS,
    );

    strategies.push({
      id: generateId('strat'),
      name: `Add ${addBus.id} to ${targetRoute.routeName}`,
      description: `Deploy standby ${addBus.id} to overcrowded ${targetRoute.routeName}`,
      type: 'add-bus',
      changes: [{
        busId: addBus.id,
        toRouteId: targetRoute.routeId,
        action: 'deploy',
        detail: `Deploy standby bus to ${targetRoute.routeName}`,
      }],
      metrics: {
        waitingTimeChange: waitingReduction,
        occupancyAfter: newOccupancy,
        costChange: costIncrease,
        overallScore: scoreStrategy(baselineObj, addBusObj),
        overcrowdedRoutes: Math.max(0, overcrowded.length - 1),
        missedConnections: Math.max(0, currentMetrics.missedConnections - rng.nextInt(5, 12)),
        avgDelay: Math.max(0, currentMetrics.delayedBuses * 3 - 3),
        fleetUtilization: clamp(currentMetrics.fleetUtilization + 5, 0, 100),
      },
      score: scoreStrategy(baselineObj, addBusObj),
      isRecommended: false,
      reasoning: [
        `${targetRoute.routeName} at critical ${Math.round(targetRoute.avgOccupancy)}% occupancy`,
        `Standby bus ${addBus.id} is available`,
        `Adds capacity to reduce passenger waiting and overcrowding`,
        `Higher cost but significant service improvement`,
      ],
      confidence: 0.91,
    });
  }

  // === Strategy 4: Increase Frequency ===
  if (overcrowded.length > 0) {
    const targetRoute = overcrowded[0];
    const newOccupancy = clamp(targetRoute.avgOccupancy * 0.72, 35, 85);
    const waitingReduction = -rng.nextFloat(18, 28);
    const costIncrease = rng.nextInt(4000, 7000);

    const freqObj = calculateObjective(
      currentMetrics.avgWaitingTime * (1 + waitingReduction / 100),
      newOccupancy,
      Math.max(0, currentMetrics.missedConnections - rng.nextInt(6, 15)),
      currentMetrics.estimatedOperatingCost + costIncrease,
      Math.max(0, currentMetrics.delayedBuses * 3 - 4),
      DEFAULT_WEIGHTS,
    );

    strategies.push({
      id: generateId('strat'),
      name: `Increase Frequency on ${targetRoute.routeName}`,
      description: `Double frequency on ${targetRoute.routeName} during peak hours`,
      type: 'increase-frequency',
      changes: [{
        action: 'increase-frequency',
        detail: `Increase frequency from ${routes.find(r => r.id === targetRoute.routeId)?.frequency || 3}/hr to ${(routes.find(r => r.id === targetRoute.routeId)?.frequency || 3) * 2}/hr`,
      }],
      metrics: {
        waitingTimeChange: waitingReduction,
        occupancyAfter: newOccupancy,
        costChange: costIncrease,
        overallScore: scoreStrategy(baselineObj, freqObj),
        overcrowdedRoutes: Math.max(0, overcrowded.length - 1),
        missedConnections: Math.max(0, currentMetrics.missedConnections - rng.nextInt(6, 15)),
        avgDelay: Math.max(0, currentMetrics.delayedBuses * 3 - 4),
        fleetUtilization: clamp(currentMetrics.fleetUtilization + 8, 0, 100),
      },
      score: scoreStrategy(baselineObj, freqObj),
      isRecommended: false,
      reasoning: [
        `${targetRoute.routeName} needs more service capacity`,
        `Doubling frequency significantly reduces waiting time`,
        `Highest cost option but best passenger experience`,
        `Requires ${Math.ceil(rng.nextFloat(2, 4))} additional bus-trips`,
      ],
      confidence: 0.84,
    });
  }

  // === Strategy 5: Modify Departure Time ===
  if (overcrowded.length > 0) {
    const targetRoute = overcrowded[0];
    const waitingReduction = -rng.nextFloat(5, 12);
    const newOccupancy = clamp(targetRoute.avgOccupancy * 0.88, 50, 92);

    const modifyObj = calculateObjective(
      currentMetrics.avgWaitingTime * (1 + waitingReduction / 100),
      newOccupancy,
      Math.max(0, currentMetrics.missedConnections - 2),
      currentMetrics.estimatedOperatingCost + 500,
      currentMetrics.delayedBuses * 3,
      DEFAULT_WEIGHTS,
    );

    strategies.push({
      id: generateId('strat'),
      name: 'Adjust Departure Times',
      description: 'Redistribute departure times to spread load more evenly',
      type: 'modify-departure',
      changes: [{
        action: 'modify-departure',
        detail: `Shift some departures by 5-10 minutes to reduce bunching on ${targetRoute.routeName}`,
      }],
      metrics: {
        waitingTimeChange: waitingReduction,
        occupancyAfter: newOccupancy,
        costChange: 500,
        overallScore: scoreStrategy(baselineObj, modifyObj),
        overcrowdedRoutes: overcrowded.length,
        missedConnections: Math.max(0, currentMetrics.missedConnections - 2),
        avgDelay: currentMetrics.delayedBuses * 3,
        fleetUtilization: currentMetrics.fleetUtilization,
      },
      score: scoreStrategy(baselineObj, modifyObj),
      isRecommended: false,
      reasoning: [
        'Low-cost option: only schedule adjustment needed',
        'Spreads passenger load across more departures',
        'Moderate improvement but no additional resources needed',
      ],
      confidence: 0.78,
    });
  }

  // Sort by score (descending) and mark best as recommended
  strategies.sort((a, b) => b.score - a.score);
  if (strategies.length > 0) {
    strategies[0].isRecommended = true;
  }

  return strategies;
}

// --- Helper: Analyze route utilization ---
interface RouteUtilization {
  routeId: string;
  routeName: string;
  avgOccupancy: number;
  busCount: number;
  totalPassengers: number;
  totalCapacity: number;
}

function analyzeRouteUtilization(
  buses: Bus[],
  routes: Route[],
  stops: Stop[],
  hour: number,
  dayOfWeek: number,
  weather: Weather,
  activeEvents: SimulationEvent[]
): RouteUtilization[] {
  return routes.map(route => {
    const routeBuses = buses.filter(b => b.assignedRouteId === route.id && b.status !== 'maintenance');
    const totalPassengers = routeBuses.reduce((sum, b) => sum + b.currentPassengers, 0);
    const totalCapacity = routeBuses.reduce((sum, b) => sum + b.capacity, 0);
    const avgOccupancy = totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;

    // Adjust for predicted demand
    const demandPred = predictDemand(
      'aggregate', route.id, route.stops.length * 50,
      hour, dayOfWeek, weather, activeEvents, '1hour'
    );
    const adjustedOccupancy = avgOccupancy * (demandPred.predicted / Math.max(1, route.stops.length * 50));

    return {
      routeId: route.id,
      routeName: route.shortName,
      avgOccupancy: clamp(adjustedOccupancy > 0 ? adjustedOccupancy : avgOccupancy, 0, 100),
      busCount: routeBuses.length,
      totalPassengers,
      totalCapacity,
    };
  });
}

/**
 * Generate a "What Should We Do?" analysis for a specific problem.
 */
export function analyzeAndRecommend(
  problemType: 'overcrowding' | 'delay' | 'missed-connection' | 'breakdown',
  input: OptimizationInput,
  targetRouteId?: string
): OptimizationStrategy[] {
  // Use the main optimizer but focus on the specific problem
  const strategies = optimizeFleet(input);

  // Re-rank based on problem type
  if (problemType === 'overcrowding') {
    strategies.sort((a, b) => a.metrics.occupancyAfter - b.metrics.occupancyAfter);
  } else if (problemType === 'delay') {
    strategies.sort((a, b) => a.metrics.avgDelay - b.metrics.avgDelay);
  } else if (problemType === 'missed-connection') {
    strategies.sort((a, b) => a.metrics.missedConnections - b.metrics.missedConnections);
  }

  // Mark new best as recommended
  strategies.forEach(s => (s.isRecommended = false));
  if (strategies.length > 0) strategies[0].isRecommended = true;

  return strategies;
}
