// =============================================================================
// TRANSOPT AI — Demand Prediction Engine
// Time-series decomposition + factor-based prediction
// =============================================================================

import type {
  DemandPrediction,
  PredictionFactor,
  OccupancyPrediction,
  StopOccupancy,
  Bus,
  Route,
  Stop,
  Weather,
  SimulationEvent,
} from '@/lib/types';
import { HOURLY_DEMAND_PATTERN, DAY_OF_WEEK_MULTIPLIER, WEATHER_DEMAND_IMPACT } from '@/lib/constants';
import { SeededRandom, clamp } from '@/lib/utils';

const rng = new SeededRandom(123);

/**
 * Predict passenger demand for a stop/route at a given time.
 */
export function predictDemand(
  stopId: string,
  routeId: string,
  baselineDemand: number,
  hour: number,
  dayOfWeek: number,
  weather: Weather,
  activeEvents: SimulationEvent[],
  timeWindow: '15min' | '30min' | '1hour' | '3hours' | '1day' = '1hour'
): DemandPrediction {
  const factors: PredictionFactor[] = [];

  // 1. Hourly pattern
  const hourlyFactor = HOURLY_DEMAND_PATTERN[Math.floor(hour) % 24];
  factors.push({
    name: 'Time of Day',
    impact: hourlyFactor,
    description: `Hour ${Math.floor(hour)} demand pattern`,
  });

  // 2. Day of week
  const dayFactor = DAY_OF_WEEK_MULTIPLIER[dayOfWeek];
  factors.push({
    name: 'Day of Week',
    impact: dayFactor,
    description: `${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayOfWeek]} multiplier`,
  });

  // 3. Weather
  const weatherFactor = WEATHER_DEMAND_IMPACT[weather.condition] || 1.0;
  if (weatherFactor !== 1.0) {
    factors.push({
      name: 'Weather',
      impact: weatherFactor,
      description: `${weather.condition} conditions`,
    });
  }

  // 4. Events
  let eventFactor = 1.0;
  activeEvents.forEach(event => {
    if (event.affectedRoutes.includes(routeId) || event.affectedStops.includes(stopId)) {
      eventFactor *= event.demandMultiplier;
      factors.push({
        name: `Event: ${event.title}`,
        impact: event.demandMultiplier,
        description: event.description,
      });
    }
  });

  // Calculate predicted demand
  const multiplier = hourlyFactor * dayFactor * weatherFactor * eventFactor;
  const predicted = Math.round(baselineDemand * multiplier);

  // Time window scaling
  const windowScale: Record<string, number> = {
    '15min': 0.25,
    '30min': 0.5,
    '1hour': 1.0,
    '3hours': 3.0,
    '1day': 24.0,
  };
  const scaledPrediction = Math.round(predicted * (windowScale[timeWindow] || 1.0));

  // Confidence interval (wider for longer windows)
  const uncertaintyBase = 0.08 + (windowScale[timeWindow] || 1) * 0.03;
  const uncertainty = uncertaintyBase + activeEvents.length * 0.04;
  const confidence = clamp(1 - uncertainty, 0.5, 0.95);

  const lower = Math.round(scaledPrediction * (1 - uncertainty));
  const upper = Math.round(scaledPrediction * (1 + uncertainty));

  return {
    stopId,
    routeId,
    timeWindow,
    predicted: scaledPrediction,
    lower,
    upper,
    confidence,
    factors,
  };
}

/**
 * Predict occupancy for a bus at upcoming stops.
 */
export function predictOccupancy(
  bus: Bus,
  route: Route,
  stops: Stop[],
  currentTime: number,
  weather: Weather,
  activeEvents: SimulationEvent[]
): OccupancyPrediction {
  const predictions: StopOccupancy[] = [];
  let runningPassengers = bus.currentPassengers;
  const hour = Math.floor(currentTime / 60);

  // Look ahead up to 5 stops
  const maxLookahead = Math.min(5, route.stops.length - bus.currentStopIndex - 1);

  for (let i = 0; i <= maxLookahead; i++) {
    const stopIdx = bus.currentStopIndex + i;
    if (stopIdx >= route.stops.length) break;

    const stopId = route.stops[stopIdx];
    const stop = stops.find(s => s.id === stopId);
    if (!stop) continue;

    if (i > 0) {
      // Predict boarding and alighting
      const demandPred = predictDemand(
        stopId, route.id, stop.avgDailyPassengers / 16, // hourly baseline
        hour, Math.floor(currentTime / 1440) % 7, weather, activeEvents, '15min'
      );

      const boarding = Math.round(demandPred.predicted * 0.3);
      const alightingRate = 0.1 + (i / maxLookahead) * 0.15; // More people get off later
      const alighting = Math.round(runningPassengers * alightingRate);

      runningPassengers = clamp(
        runningPassengers + boarding - alighting,
        0,
        bus.capacity
      );
    }

    const occupancy = (runningPassengers / bus.capacity) * 100;
    const severity: StopOccupancy['severity'] =
      occupancy >= 90 ? 'overcrowded' :
      occupancy >= 70 ? 'moderate' : 'safe';

    const seatProb = clamp((1 - occupancy / 100) * 1.2, 0, 1);
    const boardingProb = occupancy < 100 ? clamp(1 - (occupancy - 80) / 20, 0.1, 1) : 0.05;

    predictions.push({
      stopId,
      stopName: stop.name,
      stopsAway: i,
      predictedOccupancy: Math.round(occupancy),
      severity,
      boardingProbability: Math.round(boardingProb * 100),
      seatProbability: Math.round(seatProb * 100),
    });
  }

  return {
    busId: bus.id,
    routeId: route.id,
    currentOccupancy: Math.round((bus.currentPassengers / bus.capacity) * 100),
    predictions,
  };
}

/**
 * Predict delay for a bus based on current conditions.
 */
export function predictDelay(
  bus: Bus,
  route: Route,
  weather: Weather,
  activeEvents: SimulationEvent[],
  currentTime: number
): number {
  let delay = bus.delayMinutes;

  // Weather effect
  const weatherDelay = weather.delayMultiplier - 1.0;
  delay += weatherDelay * 5; // base 5 min weather delay

  // Event effects
  activeEvents.forEach(event => {
    if (event.affectedRoutes.includes(route.id)) {
      delay += (event.delayMultiplier - 1.0) * 8;
    }
  });

  // Peak hour congestion
  const hour = Math.floor(currentTime / 60);
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
    delay += rng.nextFloat(1, 4);
  }

  // Urban routes have more delay
  if (route.type === 'city') {
    delay *= 1.3;
  }

  return Math.round(clamp(delay, 0, 60));
}

/**
 * Generate demand chart data for a route over 24 hours.
 */
export function generateDemandChartData(
  routeId: string,
  baselineDemand: number,
  weather: Weather,
  activeEvents: SimulationEvent[],
  dayOfWeek: number
): Array<{ hour: number; actual: number; predicted: number; lower: number; upper: number }> {
  const data: Array<{ hour: number; actual: number; predicted: number; lower: number; upper: number }> = [];

  for (let hour = 0; hour < 24; hour++) {
    const prediction = predictDemand(
      'aggregate', routeId, baselineDemand,
      hour, dayOfWeek, weather, activeEvents, '1hour'
    );

    // Simulated "actual" with some noise
    const noise = 1 + rng.nextFloat(-0.12, 0.12);
    const actual = Math.round(prediction.predicted * noise);

    data.push({
      hour,
      actual,
      predicted: prediction.predicted,
      lower: prediction.lower,
      upper: prediction.upper,
    });
  }

  return data;
}
