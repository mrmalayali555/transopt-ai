// =============================================================================
// TRANSOPT AI — Main Application Store (Zustand)
// Single store managing simulation, network, and optimization state
// =============================================================================

import { create } from 'zustand';
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
  OptimizationStrategy,
  MaintenancePrediction,
} from '@/lib/types';
import {
  getNetworkData,
  simulationTick,
  createEventFromPreset,
  generateMaintenancePredictions,
  detectBusBunching,
} from '@/lib/engine/simulation';
import { optimizeFleet } from '@/lib/engine/optimizer';
import { evaluateConnectionInterventions } from '@/lib/engine/connection';
import { processDisruption, generateCrisisResponse } from '@/lib/engine/disruption';

interface AppStore {
  // --- Network Data ---
  buses: Bus[];
  routes: Route[];
  stops: Stop[];
  drivers: Driver[];
  isDataLoaded: boolean;

  // --- Simulation State ---
  simulation: SimulationState;
  metrics: NetworkMetrics;
  metricsHistory: NetworkMetrics[];
  recommendations: Recommendation[];
  connections: Connection[];
  strategies: OptimizationStrategy[];
  maintenancePredictions: MaintenancePrediction[];
  bunching: Array<{ routeId: string; routeName: string; isBunched: boolean; buses: Array<{ id: string; position: number }>; recommendation: string }>;

  // --- Snapshot for before/after ---
  snapshotMetrics: NetworkMetrics | null;

  // --- Dark mode ---
  isDarkMode: boolean;

  // --- Actions ---
  loadDemoData: () => void;
  tick: () => void;
  togglePlayPause: () => void;
  setSpeed: (speed: 1 | 2 | 5) => void;
  resetSimulation: () => void;
  injectEvent: (presetIndex: number) => void;
  removeEvent: (eventId: string) => void;
  toggleCrisisMode: () => void;
  runOptimization: () => void;
  applyStrategy: (strategyId: string) => void;
  takeSnapshot: () => void;
  acceptRecommendation: (recId: string) => void;
  ignoreRecommendation: (recId: string) => void;
  setWeather: (condition: Weather['condition']) => void;
  toggleDarkMode: () => void;
  setSimulationTime: (time: number) => void;
}

const DEFAULT_WEATHER: Weather = {
  condition: 'clear',
  temperature: 28,
  humidity: 75,
  windSpeed: 12,
  visibility: 10,
  demandMultiplier: 1.0,
  delayMultiplier: 1.0,
};

const DEFAULT_METRICS: NetworkMetrics = {
  activeBuses: 0,
  totalBuses: 0,
  delayedBuses: 0,
  totalPassengerDemand: 0,
  avgWaitingTime: 0,
  avgOccupancy: 0,
  overcrowdedServices: 0,
  missedConnections: 0,
  estimatedOperatingCost: 0,
  fleetUtilization: 0,
  networkHealthScore: 0,
  networkHealthLabel: 'N/A',
  onTimePerformance: 0,
  totalTrips: 0,
  completedTrips: 0,
};

export const useAppStore = create<AppStore>((set, get) => ({
  // --- Initial State ---
  buses: [],
  routes: [],
  stops: [],
  drivers: [],
  isDataLoaded: false,

  simulation: {
    isRunning: false,
    isPaused: true,
    speed: 1,
    currentTime: 420, // Start at 07:00
    currentDay: 1, // Tuesday
    currentDate: '2026-08-12',
    weather: DEFAULT_WEATHER,
    activeEvents: [],
    isCrisisMode: false,
    mode: 'normal',
  },

  metrics: DEFAULT_METRICS,
  metricsHistory: [],
  recommendations: [],
  connections: [],
  strategies: [],
  maintenancePredictions: [],
  bunching: [],
  snapshotMetrics: null,
  isDarkMode: true,

  // --- Actions ---

  loadDemoData: () => {
    const data = getNetworkData();
    const state = get();

    // Initial tick to populate metrics
    const result = simulationTick(
      state.simulation,
      data.buses,
      data.routes,
      data.stops,
      data.drivers
    );

    const maintenance = generateMaintenancePredictions(data.buses);
    const bunching = detectBusBunching(data.buses, data.routes, state.simulation.currentTime);

    set({
      buses: result.buses,
      routes: data.routes,
      stops: data.stops,
      drivers: data.drivers,
      isDataLoaded: true,
      metrics: result.metrics,
      recommendations: result.recommendations,
      connections: result.connections,
      maintenancePredictions: maintenance,
      bunching,
    });
  },

  tick: () => {
    const state = get();
    if (!state.isDataLoaded || state.simulation.isPaused) return;

    const newTime = (state.simulation.currentTime + 1) % 1440; // Wrap at midnight
    const newDay = newTime < state.simulation.currentTime
      ? (state.simulation.currentDay + 1) % 7
      : state.simulation.currentDay;

    const newSimState: SimulationState = {
      ...state.simulation,
      currentTime: newTime,
      currentDay: newDay,
      isRunning: true,
    };

    const result = simulationTick(
      newSimState,
      state.buses,
      state.routes,
      state.stops,
      state.drivers
    );

    // Keep last 100 metrics for charts
    const history = [...state.metricsHistory, result.metrics].slice(-100);

    // Merge new recommendations (keep last 20)
    const allRecs = [...result.recommendations, ...state.recommendations]
      .filter((rec, idx, arr) => arr.findIndex(r => r.title === rec.title) === idx)
      .slice(0, 20);

    // Update bunching every 10 ticks
    const bunching = newTime % 10 === 0
      ? detectBusBunching(result.buses, state.routes, newTime)
      : state.bunching;

    set({
      simulation: newSimState,
      buses: result.buses,
      metrics: result.metrics,
      metricsHistory: history,
      recommendations: allRecs,
      connections: result.connections,
      bunching,
    });
  },

  togglePlayPause: () => {
    set(state => ({
      simulation: {
        ...state.simulation,
        isPaused: !state.simulation.isPaused,
        isRunning: state.simulation.isPaused, // toggle
      },
    }));
  },

  setSpeed: (speed: 1 | 2 | 5) => {
    set(state => ({
      simulation: { ...state.simulation, speed },
    }));
  },

  resetSimulation: () => {
    const data = getNetworkData();
    set(state => ({
      buses: data.buses,
      routes: data.routes,
      stops: data.stops,
      drivers: data.drivers,
      simulation: {
        ...state.simulation,
        currentTime: 420,
        currentDay: 1,
        isRunning: false,
        isPaused: true,
        activeEvents: [],
        isCrisisMode: false,
        mode: 'normal',
        weather: DEFAULT_WEATHER,
      },
      metrics: DEFAULT_METRICS,
      metricsHistory: [],
      recommendations: [],
      connections: [],
      strategies: [],
      snapshotMetrics: null,
    }));
    // Re-initialize
    get().loadDemoData();
  },

  injectEvent: (presetIndex: number) => {
    const state = get();
    const event = createEventFromPreset(
      presetIndex,
      state.routes,
      state.stops,
      state.simulation.currentTime
    );

    set(state => ({
      simulation: {
        ...state.simulation,
        activeEvents: [...state.simulation.activeEvents, event],
      },
    }));
  },

  removeEvent: (eventId: string) => {
    set(state => ({
      simulation: {
        ...state.simulation,
        activeEvents: state.simulation.activeEvents.filter(e => e.id !== eventId),
      },
    }));
  },

  toggleCrisisMode: () => {
    set(state => ({
      simulation: {
        ...state.simulation,
        isCrisisMode: !state.simulation.isCrisisMode,
        mode: state.simulation.isCrisisMode ? 'normal' : 'crisis',
      },
    }));
  },

  runOptimization: () => {
    const state = get();
    const strategies = optimizeFleet({
      buses: state.buses,
      routes: state.routes,
      stops: state.stops,
      drivers: state.drivers,
      weather: state.simulation.weather,
      activeEvents: state.simulation.activeEvents,
      currentTime: state.simulation.currentTime,
      dayOfWeek: state.simulation.currentDay,
      currentMetrics: state.metrics,
    });

    set({ strategies });
  },

  applyStrategy: (strategyId: string) => {
    const state = get();
    const strategy = state.strategies.find(s => s.id === strategyId);
    if (!strategy) return;

    // Apply changes to buses
    const updatedBuses = [...state.buses];
    strategy.changes.forEach(change => {
      if (change.busId && change.toRouteId) {
        const busIdx = updatedBuses.findIndex(b => b.id === change.busId);
        if (busIdx >= 0) {
          updatedBuses[busIdx] = {
            ...updatedBuses[busIdx],
            assignedRouteId: change.toRouteId,
            currentStopIndex: 0,
            nextStopIndex: 1,
            status: 'in-service',
          };
        }
      }
    });

    // Update metrics (simulate improvement)
    const newMetrics = {
      ...state.metrics,
      avgWaitingTime: Math.round(state.metrics.avgWaitingTime * (1 + strategy.metrics.waitingTimeChange / 100) * 10) / 10,
      avgOccupancy: strategy.metrics.occupancyAfter,
      overcrowdedServices: strategy.metrics.overcrowdedRoutes,
      missedConnections: strategy.metrics.missedConnections,
      estimatedOperatingCost: state.metrics.estimatedOperatingCost + strategy.metrics.costChange,
    };

    set({
      buses: updatedBuses,
      metrics: newMetrics,
      strategies: state.strategies.map(s =>
        s.id === strategyId ? { ...s, isRecommended: false } : s
      ),
    });
  },

  takeSnapshot: () => {
    set(state => ({
      snapshotMetrics: { ...state.metrics },
    }));
  },

  acceptRecommendation: (recId: string) => {
    set(state => ({
      recommendations: state.recommendations.map(r =>
        r.id === recId ? { ...r, status: 'accepted' } : r
      ),
    }));
  },

  ignoreRecommendation: (recId: string) => {
    set(state => ({
      recommendations: state.recommendations.map(r =>
        r.id === recId ? { ...r, status: 'ignored' } : r
      ),
    }));
  },

  setWeather: (condition: Weather['condition']) => {
    const weatherMap: Record<string, Partial<Weather>> = {
      'clear': { condition: 'clear', demandMultiplier: 1.0, delayMultiplier: 1.0 },
      'cloudy': { condition: 'cloudy', demandMultiplier: 1.0, delayMultiplier: 1.0 },
      'light-rain': { condition: 'light-rain', demandMultiplier: 1.15, delayMultiplier: 1.15 },
      'heavy-rain': { condition: 'heavy-rain', demandMultiplier: 1.35, delayMultiplier: 1.45 },
      'storm': { condition: 'storm', demandMultiplier: 0.60, delayMultiplier: 2.0 },
      'fog': { condition: 'fog', demandMultiplier: 0.90, delayMultiplier: 1.30 },
    };

    const weatherUpdate = weatherMap[condition] || weatherMap['clear'];

    set(state => ({
      simulation: {
        ...state.simulation,
        weather: { ...state.simulation.weather, ...weatherUpdate },
      },
    }));
  },

  toggleDarkMode: () => {
    set(state => ({ isDarkMode: !state.isDarkMode }));
  },

  setSimulationTime: (time: number) => {
    set(state => ({
      simulation: { ...state.simulation, currentTime: time },
    }));
  },
}));
