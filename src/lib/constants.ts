// =============================================================================
// TRANSOPT AI — Constants & Configuration
// =============================================================================

export const APP_NAME = 'TRANSOPT AI';
export const APP_SUBTITLE = 'AI-Powered Dynamic Public Transport Intelligence & Optimization Platform';
export const DISCLAIMER = 'Prototype / Simulation — Not an Official KSRTC System';

// Optimization weights (default)
export const DEFAULT_WEIGHTS = {
  waitingTime: 0.30,
  overcrowding: 0.25,
  missedConnections: 0.20,
  operatingCost: 0.15,
  delay: 0.10,
};

// Crisis mode weights (safety prioritized)
export const CRISIS_WEIGHTS = {
  waitingTime: 0.10,
  overcrowding: 0.15,
  missedConnections: 0.10,
  operatingCost: 0.05,
  delay: 0.05,
  passengerSafety: 0.35,
  accessibility: 0.10,
  emergencyConnectivity: 0.10,
};

// Demand patterns (hourly multipliers for a typical weekday)
export const HOURLY_DEMAND_PATTERN: number[] = [
  0.10, 0.05, 0.03, 0.03, 0.05, 0.15, // 00-05
  0.40, 0.75, 1.00, 0.85, 0.65, 0.55, // 06-11
  0.60, 0.50, 0.45, 0.55, 0.70, 0.95, // 12-17
  0.90, 0.70, 0.50, 0.35, 0.25, 0.15, // 18-23
];

// Day of week multipliers (Mon=0 ... Sun=6)
export const DAY_OF_WEEK_MULTIPLIER: number[] = [
  1.00, 1.00, 1.00, 1.00, 1.05, 0.80, 0.60,
];

// Weather impact on demand
export const WEATHER_DEMAND_IMPACT: Record<string, number> = {
  'clear': 1.0,
  'cloudy': 1.0,
  'light-rain': 1.15,
  'heavy-rain': 1.35,
  'storm': 0.60,
  'fog': 0.90,
};

// Weather impact on delay
export const WEATHER_DELAY_IMPACT: Record<string, number> = {
  'clear': 1.0,
  'cloudy': 1.0,
  'light-rain': 1.15,
  'heavy-rain': 1.45,
  'storm': 2.0,
  'fog': 1.30,
};

// Event presets for injection
export const EVENT_PRESETS = [
  {
    type: 'heavy-rain' as const,
    title: '🌧️ Heavy Rain',
    description: 'Heavy rainfall affecting road conditions and visibility',
    severity: 'high' as const,
    demandMultiplier: 1.35,
    delayMultiplier: 1.45,
    capacityMultiplier: 1.0,
    icon: '🌧️',
  },
  {
    type: 'festival' as const,
    title: '🎉 Festival',
    description: 'Major festival causing demand surge in specific areas',
    severity: 'medium' as const,
    demandMultiplier: 1.60,
    delayMultiplier: 1.20,
    capacityMultiplier: 1.0,
    icon: '🎉',
  },
  {
    type: 'road-closure' as const,
    title: '🚧 Road Closure',
    description: 'Road closure requiring route diversions',
    severity: 'high' as const,
    demandMultiplier: 1.10,
    delayMultiplier: 1.80,
    capacityMultiplier: 0.50,
    icon: '🚧',
  },
  {
    type: 'bus-breakdown' as const,
    title: '🔧 Bus Breakdown',
    description: 'Bus breakdown reducing fleet availability',
    severity: 'medium' as const,
    demandMultiplier: 1.0,
    delayMultiplier: 1.0,
    capacityMultiplier: 0.90,
    icon: '🔧',
  },
  {
    type: 'traffic-surge' as const,
    title: '🚗 Traffic Surge',
    description: 'Unusual traffic congestion on major roads',
    severity: 'medium' as const,
    demandMultiplier: 1.10,
    delayMultiplier: 1.50,
    capacityMultiplier: 1.0,
    icon: '🚗',
  },
  {
    type: 'demand-surge' as const,
    title: '📈 Demand Surge',
    description: '+30% passenger demand across the network',
    severity: 'high' as const,
    demandMultiplier: 1.30,
    delayMultiplier: 1.10,
    capacityMultiplier: 1.0,
    icon: '📈',
  },
  {
    type: 'driver-shortage' as const,
    title: '👤 Driver Shortage',
    description: '20% of drivers unavailable',
    severity: 'high' as const,
    demandMultiplier: 1.0,
    delayMultiplier: 1.15,
    capacityMultiplier: 0.80,
    icon: '👤',
  },
  {
    type: 'flood' as const,
    title: '🌊 Flood',
    description: 'Flooding in low-lying areas affecting multiple routes',
    severity: 'critical' as const,
    demandMultiplier: 0.70,
    delayMultiplier: 2.50,
    capacityMultiplier: 0.40,
    icon: '🌊',
  },
  {
    type: 'landslide' as const,
    title: '⛰️ Landslide',
    description: 'Landslide blocking roads in hilly terrain',
    severity: 'critical' as const,
    demandMultiplier: 0.80,
    delayMultiplier: 3.00,
    capacityMultiplier: 0.30,
    icon: '⛰️',
  },
  {
    type: 'major-event' as const,
    title: '🔥 Major Event',
    description: 'Large public gathering causing massive demand surge',
    severity: 'high' as const,
    demandMultiplier: 2.00,
    delayMultiplier: 1.40,
    capacityMultiplier: 1.0,
    icon: '🔥',
  },
];

// Simulation defaults
export const SIM_TICK_INTERVAL_MS = 100; // ms between ticks at 1x
export const SIM_MINUTES_PER_TICK = 1; // simulation minutes per tick
export const DEFAULT_SIM_SPEED = 1;

// Map settings
export const MAP_CENTER = { lat: 11.0, lng: 76.1 }; // Central Kerala
export const MAP_ZOOM = 9;
export const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Colors for routes on map
export const ROUTE_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
  '#14b8a6', '#e11d48', '#0ea5e9', '#d946ef', '#facc15',
  '#22c55e', '#a855f7', '#f43f5e', '#2dd4bf', '#fb923c',
  '#818cf8', '#34d399', '#fbbf24', '#c084fc', '#38bdf8',
];

// Nav items
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/' },
  { id: 'network', label: 'Live Network', icon: 'Map', href: '/network' },
  { id: 'demand', label: 'Demand AI', icon: 'TrendingUp', href: '/demand' },
  { id: 'fleet', label: 'Fleet Optimizer', icon: 'Truck', href: '/fleet' },
  { id: 'connections', label: 'Connections', icon: 'GitBranch', href: '/connections' },
  { id: 'simulation', label: 'Digital Twin', icon: 'Box', href: '/simulation' },
  { id: 'crisis', label: 'Crisis Mode', icon: 'AlertTriangle', href: '/crisis' },
  { id: 'routes', label: 'Routes', icon: 'Route', href: '/routes' },
  { id: 'fleet-health', label: 'Fleet Health', icon: 'Heart', href: '/fleet-health' },
  { id: 'passenger', label: 'Passenger View', icon: 'Users', href: '/passenger' },
  { id: 'assistant', label: 'AI Assistant', icon: 'MessageSquare', href: '/assistant' },
  { id: 'reports', label: 'Reports', icon: 'FileText', href: '/reports' },
  { id: 'data', label: 'Data', icon: 'Database', href: '/data' },
  { id: 'settings', label: 'Settings', icon: 'Settings', href: '/settings' },
];
