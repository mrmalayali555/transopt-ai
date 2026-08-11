// =============================================================================
// TRANSOPT AI — Core Type Definitions
// AI-Powered Dynamic Public Transport Intelligence & Optimization Platform
// =============================================================================

// --- Geographic Types ---
export interface Coordinates {
  lat: number;
  lng: number;
}

// --- Stop ---
export interface Stop {
  id: string;
  name: string;
  coordinates: Coordinates;
  zone: string; // e.g., 'urban', 'suburban', 'rural'
  shelterType: 'covered' | 'open' | 'none';
  avgDailyPassengers: number;
  connectedRoutes: string[];
  isTransferPoint: boolean;
}

// --- Route ---
export interface Route {
  id: string;
  name: string;
  shortName: string;
  stops: string[]; // Stop IDs in order
  distanceKm: number;
  estimatedDurationMin: number;
  type: 'express' | 'ordinary' | 'superfast' | 'city';
  frequency: number; // departures per hour (normal)
  farePerKm: number;
  color: string; // for map display
  path: Coordinates[]; // polyline for map
}

// --- Bus ---
export interface Bus {
  id: string;
  registrationNumber: string;
  type: 'standard' | 'minibus' | 'articulated' | 'electric';
  capacity: number;
  currentPassengers: number;
  assignedRouteId: string | null;
  assignedDriverId: string | null;
  currentStopIndex: number;
  nextStopIndex: number;
  currentPosition: Coordinates;
  status: BusStatus;
  delayMinutes: number;
  speedKmh: number;
  fuelLevel: number;
  mileage: number;
  age: number; // years
  lastMaintenanceDate: string;
  maintenanceScore: number; // 0-100
  condition: 'excellent' | 'good' | 'fair' | 'poor';
}

export type BusStatus =
  | 'in-service'
  | 'at-stop'
  | 'idle'
  | 'maintenance'
  | 'breakdown'
  | 'standby'
  | 'returning';

// --- Driver ---
export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  experience: number; // years
  shiftStart: string; // HH:mm
  shiftEnd: string;
  status: 'on-duty' | 'off-duty' | 'on-break' | 'unavailable';
  assignedBusId: string | null;
  hoursWorkedToday: number;
  maxHoursPerDay: number;
  rating: number; // 1-5
}

// --- Schedule ---
export interface Schedule {
  id: string;
  routeId: string;
  busId: string;
  driverId: string;
  departureTime: string; // HH:mm
  arrivalTime: string;
  dayOfWeek: number[]; // 0-6
  isActive: boolean;
}

// --- Trip ---
export interface Trip {
  id: string;
  scheduleId: string;
  routeId: string;
  busId: string;
  driverId: string;
  departureTime: number; // simulation minutes
  actualDepartureTime: number;
  arrivalTime: number;
  actualArrivalTime: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'delayed';
  stopTimes: StopTime[];
}

export interface StopTime {
  stopId: string;
  scheduledArrival: number;
  actualArrival: number;
  boardings: number;
  alightings: number;
  passengersAfter: number;
  dwellTimeSeconds: number;
}

// --- Passenger Demand ---
export interface DemandRecord {
  stopId: string;
  routeId: string;
  hour: number;
  dayOfWeek: number;
  month: number;
  isHoliday: boolean;
  weatherCondition: WeatherCondition;
  eventType: EventType | null;
  passengerCount: number;
  boardings: number;
  alightings: number;
}

export interface DemandPrediction {
  stopId: string;
  routeId: string;
  timeWindow: '15min' | '30min' | '1hour' | '3hours' | '1day';
  predicted: number;
  lower: number; // confidence interval
  upper: number;
  confidence: number; // 0-1
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  name: string;
  impact: number; // multiplier
  description: string;
}

// --- Occupancy ---
export interface OccupancyPrediction {
  busId: string;
  routeId: string;
  currentOccupancy: number; // percentage
  predictions: StopOccupancy[];
}

export interface StopOccupancy {
  stopId: string;
  stopName: string;
  stopsAway: number;
  predictedOccupancy: number;
  severity: 'safe' | 'moderate' | 'overcrowded';
  boardingProbability: number;
  seatProbability: number;
}

// --- Weather ---
export type WeatherCondition = 'clear' | 'cloudy' | 'light-rain' | 'heavy-rain' | 'storm' | 'fog';

export interface Weather {
  condition: WeatherCondition;
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  demandMultiplier: number;
  delayMultiplier: number;
}

// --- Events ---
export type EventType =
  | 'festival'
  | 'heavy-rain'
  | 'road-closure'
  | 'bus-breakdown'
  | 'traffic-surge'
  | 'demand-surge'
  | 'driver-shortage'
  | 'accident'
  | 'flood'
  | 'landslide'
  | 'strike'
  | 'major-event';

export interface SimulationEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedRoutes: string[];
  affectedStops: string[];
  startTime: number; // simulation minutes
  endTime: number | null;
  demandMultiplier: number;
  delayMultiplier: number;
  capacityMultiplier: number; // e.g., road closure reduces capacity
  isActive: boolean;
  icon: string;
}

// --- Disruption ---
export interface Disruption {
  id: string;
  event: SimulationEvent;
  affectedPassengers: number;
  affectedBuses: string[];
  alternativeRoutes: string[];
  recommendedActions: DisruptionAction[];
  status: 'detected' | 'responding' | 'resolved';
}

export interface ActionImpact {
  passengersSaved: number;
  delayReduction: number;
  additionalCost: number;
}

export interface DisruptionAction {
  id: string;
  type: 'reroute' | 'add-bus' | 'reassign' | 'cancel' | 'hold' | 'increase-frequency';
  description: string;
  estimatedImpact: ActionImpact;
  priority: number;
}

// --- Connection ---
export interface Connection {
  id: string;
  fromBusId: string;
  fromRouteId: string;
  toBusId: string;
  toRouteId: string;
  transferStopId: string;
  fromETA: number; // simulation minutes
  toScheduledDeparture: number;
  transferringPassengers: number;
  status: 'safe' | 'at-risk' | 'missed';
  bufferMinutes: number;
  missedProbability: number;
}

export interface ConnectionIntervention {
  id: string;
  connectionId: string;
  type: 'hold' | 'dont-hold' | 'redirect';
  description: string;
  passengersSaved: number;
  passengersDelayed: number;
  totalDelayMinutes: number;
  score: number;
}

// --- Optimization ---
export interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  type: 'add-bus' | 'reassign' | 'increase-frequency' | 'modify-departure' | 'do-nothing' | 'reroute' | 'reduce-frequency';
  changes: StrategyChange[];
  metrics: StrategyMetrics;
  score: number;
  isRecommended: boolean;
  reasoning: string[];
  confidence: number;
}

export interface StrategyChange {
  busId?: string;
  fromRouteId?: string;
  toRouteId?: string;
  action: string;
  detail: string;
}

export interface StrategyMetrics {
  waitingTimeChange: number; // percentage
  occupancyAfter: number; // percentage
  costChange: number; // in currency
  overallScore: number;
  overcrowdedRoutes: number;
  missedConnections: number;
  avgDelay: number;
  fleetUtilization: number;
}

// --- AI Recommendation ---
export interface Recommendation {
  id: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'critical';
  category: 'overcrowding' | 'connection' | 'delay' | 'maintenance' | 'optimization' | 'disruption';
  title: string;
  reason: string;
  dataUsed: string[];
  expectedImpact: string;
  confidence: number;
  recommendedAction: string;
  strategies: OptimizationStrategy[];
  status: 'pending' | 'accepted' | 'simulated' | 'applied' | 'ignored';
}

// --- Simulation State ---
export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  speed: 1 | 2 | 5;
  currentTime: number; // minutes from midnight
  currentDay: number; // day of week 0-6
  currentDate: string;
  weather: Weather;
  activeEvents: SimulationEvent[];
  isCrisisMode: boolean;
  mode: 'normal' | 'crisis' | 'presentation';
}

// --- Network Metrics ---
export interface NetworkMetrics {
  activeBuses: number;
  totalBuses: number;
  delayedBuses: number;
  totalPassengerDemand: number;
  avgWaitingTime: number;
  avgOccupancy: number;
  overcrowdedServices: number;
  missedConnections: number;
  estimatedOperatingCost: number;
  fleetUtilization: number;
  networkHealthScore: number;
  networkHealthLabel: string;
  onTimePerformance: number;
  totalTrips: number;
  completedTrips: number;
}

// --- Passenger Journey ---
export interface JourneyOption {
  id: string;
  label: string; // 'Fastest', 'Least Crowded', 'Most Reliable', 'Best Overall'
  legs: JourneyLeg[];
  totalDuration: number;
  transfers: number;
  estimatedCost: number;
  seatProbability: number;
  boardingProbability: number;
  reliability: number;
  crowdingLevel: 'low' | 'moderate' | 'high';
  overallScore: number;
  reasoning: string;
}

export interface JourneyLeg {
  busId: string;
  routeId: string;
  routeName: string;
  fromStop: string;
  toStop: string;
  departureTime: number;
  arrivalTime: number;
  occupancy: number;
  seatProbability: number;
}

// --- Maintenance ---
export interface MaintenanceRecord {
  id: string;
  busId: string;
  type: 'scheduled' | 'unscheduled' | 'emergency';
  description: string;
  date: string;
  cost: number;
  durationHours: number;
  parts: string[];
}

export interface MaintenancePrediction {
  busId: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  factors: MaintenanceFactor[];
  nextScheduledDate: string;
  recommendedAction: string;
}

export interface MaintenanceFactor {
  name: string;
  value: number;
  weight: number;
  description: string;
}

// --- Bus Bunching ---
export interface BunchingDetection {
  routeId: string;
  buses: BunchingBus[];
  isBunched: boolean;
  gapMinutes: number;
  expectedGapMinutes: number;
  recommendation: string;
}

export interface BunchingBus {
  busId: string;
  position: Coordinates;
  timeAtPosition: number;
}

// --- Route Performance ---
export interface RoutePerformance {
  routeId: string;
  routeName: string;
  avgDailyPassengers: number;
  avgOccupancy: number;
  revenue: number;
  operatingCost: number;
  avgDelay: number;
  avgWaitingTime: number;
  reliability: number;
  missedConnections: number;
  utilization: number;
  performanceScore: number;
  diagnosis: string;
  recommendations: string[];
}

// --- Report ---
export interface Report {
  id: string;
  type: 'daily' | 'optimization' | 'crisis';
  title: string;
  generatedAt: string;
  metrics: NetworkMetrics;
  recommendations: Recommendation[];
  events: SimulationEvent[];
  beforeMetrics?: NetworkMetrics;
  afterMetrics?: NetworkMetrics;
}

// --- AI Assistant ---
export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  data?: Record<string, unknown>;
  sources?: string[];
}

// --- Presentation Step ---
export interface PresentationStep {
  id: number;
  title: string;
  description: string;
  action?: () => void;
  highlightComponent?: string;
}
