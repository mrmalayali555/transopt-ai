// =============================================================================
// TRANSOPT AI — Kerala-Like Transport Network Definition
// Simulated network inspired by Kerala geography (NOT official KSRTC data)
// =============================================================================

import type { Stop, Route, Bus, Driver, Coordinates } from '@/lib/types';
import { SeededRandom } from '@/lib/utils';
import { ROUTE_COLORS } from '@/lib/constants';

const rng = new SeededRandom(42);

// --- Cities / Major Stops ---
// Real Kerala coordinates used for geographic accuracy on OSM tiles.
// Routes and schedules are SIMULATED.

interface CityDef {
  name: string;
  coords: Coordinates;
  zone: 'urban' | 'suburban' | 'rural';
  importance: number; // 1-10
}

const CITIES: CityDef[] = [
  { name: 'Kozhikode (Calicut)', coords: { lat: 11.2588, lng: 75.7804 }, zone: 'urban', importance: 10 },
  { name: 'Kochi (Ernakulam)', coords: { lat: 9.9312, lng: 76.2673 }, zone: 'urban', importance: 10 },
  { name: 'Thrissur', coords: { lat: 10.5276, lng: 76.2144 }, zone: 'urban', importance: 9 },
  { name: 'Palakkad', coords: { lat: 10.7867, lng: 76.6548 }, zone: 'urban', importance: 8 },
  { name: 'Malappuram', coords: { lat: 11.0510, lng: 76.0711 }, zone: 'urban', importance: 8 },
  { name: 'Kannur', coords: { lat: 11.8745, lng: 75.3704 }, zone: 'urban', importance: 8 },
  { name: 'Manjeri', coords: { lat: 11.1204, lng: 76.1200 }, zone: 'suburban', importance: 7 },
  { name: 'Perinthalmanna', coords: { lat: 10.9756, lng: 76.2295 }, zone: 'suburban', importance: 6 },
  { name: 'Nilambur', coords: { lat: 11.2756, lng: 76.2260 }, zone: 'suburban', importance: 6 },
  { name: 'Angamaly', coords: { lat: 10.1960, lng: 76.3860 }, zone: 'suburban', importance: 7 },
  { name: 'Guruvayur', coords: { lat: 10.5946, lng: 76.0413 }, zone: 'suburban', importance: 7 },
  { name: 'Wadakkanchery', coords: { lat: 10.6572, lng: 76.2567 }, zone: 'rural', importance: 5 },
  { name: 'Shoranur', coords: { lat: 10.7621, lng: 76.2760 }, zone: 'suburban', importance: 6 },
  { name: 'Ottapalam', coords: { lat: 10.7729, lng: 76.3790 }, zone: 'rural', importance: 5 },
  { name: 'Tirur', coords: { lat: 10.9133, lng: 75.9220 }, zone: 'suburban', importance: 6 },
  { name: 'Kondotty', coords: { lat: 11.0419, lng: 75.9649 }, zone: 'suburban', importance: 5 },
  { name: 'Koyilandy', coords: { lat: 11.4430, lng: 75.6930 }, zone: 'suburban', importance: 6 },
  { name: 'Vadakara', coords: { lat: 11.5951, lng: 75.4918 }, zone: 'suburban', importance: 6 },
  { name: 'Thalassery', coords: { lat: 11.7476, lng: 75.4910 }, zone: 'suburban', importance: 7 },
  { name: 'Chalakudy', coords: { lat: 10.3006, lng: 76.3312 }, zone: 'suburban', importance: 5 },
  { name: 'Irinjalakuda', coords: { lat: 10.3438, lng: 76.2139 }, zone: 'suburban', importance: 5 },
  { name: 'Kunnamkulam', coords: { lat: 10.6497, lng: 76.0715 }, zone: 'suburban', importance: 5 },
  { name: 'Chavakkad', coords: { lat: 10.5819, lng: 76.0181 }, zone: 'suburban', importance: 5 },
  { name: 'Aluva', coords: { lat: 10.1004, lng: 76.3570 }, zone: 'suburban', importance: 7 },
  { name: 'Perumbavoor', coords: { lat: 10.1072, lng: 76.4734 }, zone: 'suburban', importance: 5 },
  { name: 'Muvattupuzha', coords: { lat: 9.9822, lng: 76.5789 }, zone: 'suburban', importance: 5 },
  { name: 'Thodupuzha', coords: { lat: 9.8955, lng: 76.7169 }, zone: 'suburban', importance: 5 },
  { name: 'Ponnani', coords: { lat: 10.7671, lng: 75.9267 }, zone: 'rural', importance: 5 },
  { name: 'Edappal', coords: { lat: 10.7828, lng: 76.0094 }, zone: 'rural', importance: 4 },
  { name: 'Feroke', coords: { lat: 11.1780, lng: 75.8450 }, zone: 'suburban', importance: 5 },
];

// Generate intermediate stops between cities along a route
function generateIntermediateStops(
  from: CityDef,
  to: CityDef,
  count: number,
  routeId: string
): Stop[] {
  const stops: Stop[] = [];
  const suffixes = ['Junction', 'Bus Stand', 'Cross Road', 'Town', 'Market', 'Bridge', 'Temple'];
  const prefixes = ['Kara', 'Vala', 'Puzha', 'Kavu', 'Chira', 'Para', 'Thodu', 'Mala', 'Kunnu', 'Cheri', 'Thara', 'Kadavu'];

  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const lat = from.coords.lat + (to.coords.lat - from.coords.lat) * t + rng.nextFloat(-0.02, 0.02);
    const lng = from.coords.lng + (to.coords.lng - from.coords.lng) * t + rng.nextFloat(-0.02, 0.02);
    const name = `${rng.pick(prefixes)}${rng.pick(suffixes)}`;

    stops.push({
      id: `stop-${routeId}-${i}`,
      name,
      coordinates: { lat, lng },
      zone: rng.next() > 0.5 ? 'suburban' : 'rural',
      shelterType: rng.pick(['covered', 'open', 'none']),
      avgDailyPassengers: rng.nextInt(50, 500),
      connectedRoutes: [routeId],
      isTransferPoint: false,
    });
  }
  return stops;
}

// --- Route Definitions ---
interface RouteDef {
  name: string;
  shortName: string;
  from: string; // city name
  to: string;
  type: 'express' | 'ordinary' | 'superfast' | 'city';
  intermediateStops: number;
  via?: string[]; // city names for waypoints
}

const ROUTE_DEFS: RouteDef[] = [
  { name: 'Kozhikode - Kochi Express', shortName: 'KZH-KCH', from: 'Kozhikode (Calicut)', to: 'Kochi (Ernakulam)', type: 'superfast', intermediateStops: 6, via: ['Tirur', 'Thrissur', 'Angamaly'] },
  { name: 'Kozhikode - Nilambur', shortName: 'KZH-NLB', from: 'Kozhikode (Calicut)', to: 'Nilambur', type: 'ordinary', intermediateStops: 5, via: ['Feroke', 'Manjeri'] },
  { name: 'Kozhikode - Malappuram', shortName: 'KZH-MLP', from: 'Kozhikode (Calicut)', to: 'Malappuram', type: 'ordinary', intermediateStops: 4, via: ['Kondotty'] },
  { name: 'Kozhikode - Kannur', shortName: 'KZH-KNR', from: 'Kozhikode (Calicut)', to: 'Kannur', type: 'superfast', intermediateStops: 4, via: ['Koyilandy', 'Vadakara', 'Thalassery'] },
  { name: 'Thrissur - Palakkad', shortName: 'TSR-PKD', from: 'Thrissur', to: 'Palakkad', type: 'ordinary', intermediateStops: 4, via: ['Wadakkanchery', 'Shoranur'] },
  { name: 'Kochi - Thrissur Fast', shortName: 'KCH-TSR', from: 'Kochi (Ernakulam)', to: 'Thrissur', type: 'express', intermediateStops: 4, via: ['Aluva', 'Chalakudy'] },
  { name: 'Malappuram - Perinthalmanna', shortName: 'MLP-PTM', from: 'Malappuram', to: 'Perinthalmanna', type: 'ordinary', intermediateStops: 3 },
  { name: 'Manjeri - Nilambur Local', shortName: 'MNJ-NLB', from: 'Manjeri', to: 'Nilambur', type: 'ordinary', intermediateStops: 4 },
  { name: 'Kozhikode - Palakkad', shortName: 'KZH-PKD', from: 'Kozhikode (Calicut)', to: 'Palakkad', type: 'express', intermediateStops: 5, via: ['Malappuram', 'Perinthalmanna'] },
  { name: 'Thrissur - Guruvayur', shortName: 'TSR-GVR', from: 'Thrissur', to: 'Guruvayur', type: 'city', intermediateStops: 3, via: ['Kunnamkulam'] },
  { name: 'Kannur - Thalassery', shortName: 'KNR-TLS', from: 'Kannur', to: 'Thalassery', type: 'city', intermediateStops: 3 },
  { name: 'Kochi - Muvattupuzha', shortName: 'KCH-MVT', from: 'Kochi (Ernakulam)', to: 'Muvattupuzha', type: 'ordinary', intermediateStops: 3, via: ['Perumbavoor'] },
  { name: 'Angamaly - Thrissur', shortName: 'ANG-TSR', from: 'Angamaly', to: 'Thrissur', type: 'ordinary', intermediateStops: 4, via: ['Chalakudy', 'Irinjalakuda'] },
  { name: 'Kozhikode City Circular', shortName: 'KZH-CTY', from: 'Kozhikode (Calicut)', to: 'Feroke', type: 'city', intermediateStops: 6 },
  { name: 'Vadakara - Kozhikode', shortName: 'VDK-KZH', from: 'Vadakara', to: 'Kozhikode (Calicut)', type: 'ordinary', intermediateStops: 3, via: ['Koyilandy'] },
  { name: 'Shoranur - Ottapalam', shortName: 'SHR-OTP', from: 'Shoranur', to: 'Ottapalam', type: 'ordinary', intermediateStops: 2 },
  { name: 'Tirur - Ponnani', shortName: 'TRR-PNN', from: 'Tirur', to: 'Ponnani', type: 'ordinary', intermediateStops: 3, via: ['Edappal'] },
  { name: 'Kochi City Service', shortName: 'KCH-CTY', from: 'Kochi (Ernakulam)', to: 'Aluva', type: 'city', intermediateStops: 5 },
  { name: 'Thrissur - Kunnamkulam', shortName: 'TSR-KNM', from: 'Thrissur', to: 'Kunnamkulam', type: 'city', intermediateStops: 3, via: ['Chavakkad'] },
  { name: 'Perumbavoor - Thodupuzha', shortName: 'PBR-TDP', from: 'Perumbavoor', to: 'Thodupuzha', type: 'ordinary', intermediateStops: 3, via: ['Muvattupuzha'] },
  { name: 'Kozhikode - Vadakara Express', shortName: 'KZH-VDK', from: 'Kozhikode (Calicut)', to: 'Vadakara', type: 'express', intermediateStops: 2, via: ['Koyilandy'] },
  { name: 'Malappuram - Tirur', shortName: 'MLP-TRR', from: 'Malappuram', to: 'Tirur', type: 'ordinary', intermediateStops: 3, via: ['Kondotty'] },
  { name: 'Nilambur - Manjeri - Malappuram', shortName: 'NLB-MLP', from: 'Nilambur', to: 'Malappuram', type: 'ordinary', intermediateStops: 4, via: ['Manjeri'] },
  { name: 'Palakkad - Shoranur - Thrissur', shortName: 'PKD-TSR', from: 'Palakkad', to: 'Thrissur', type: 'express', intermediateStops: 3, via: ['Shoranur'] },
  { name: 'Kannur - Kozhikode Superfast', shortName: 'KNR-KZH', from: 'Kannur', to: 'Kozhikode (Calicut)', type: 'superfast', intermediateStops: 3, via: ['Thalassery', 'Vadakara'] },
];

// Build the complete network
export function buildKeralaNetwork(): {
  stops: Stop[];
  routes: Route[];
  buses: Bus[];
  drivers: Driver[];
} {
  const cityMap = new Map<string, CityDef>();
  CITIES.forEach(c => cityMap.set(c.name, c));

  const allStops: Stop[] = [];
  const allRoutes: Route[] = [];
  const stopIdMap = new Map<string, Stop>(); // city name → stop

  // Create major city stops
  CITIES.forEach((city, idx) => {
    const stop: Stop = {
      id: `stop-city-${idx}`,
      name: city.name,
      coordinates: city.coords,
      zone: city.zone,
      shelterType: 'covered',
      avgDailyPassengers: city.importance * rng.nextInt(200, 500),
      connectedRoutes: [],
      isTransferPoint: city.importance >= 7,
    };
    allStops.push(stop);
    stopIdMap.set(city.name, stop);
  });

  // Create routes with intermediate stops
  ROUTE_DEFS.forEach((rd, idx) => {
    const routeId = `route-${idx + 1}`;
    const fromCity = cityMap.get(rd.from);
    const toCity = cityMap.get(rd.to);
    if (!fromCity || !toCity) return;

    // Build stop sequence
    const routeStopIds: string[] = [];
    const routePath: Coordinates[] = [];

    // From stop
    const fromStop = stopIdMap.get(rd.from)!;
    fromStop.connectedRoutes.push(routeId);
    routeStopIds.push(fromStop.id);
    routePath.push(fromStop.coordinates);

    // Via stops (use city stops)
    if (rd.via) {
      rd.via.forEach(viaName => {
        const viaStop = stopIdMap.get(viaName);
        if (viaStop) {
          viaStop.connectedRoutes.push(routeId);
          routeStopIds.push(viaStop.id);
          routePath.push(viaStop.coordinates);
        }
      });
    }

    // Intermediate stops
    const intermediates = generateIntermediateStops(fromCity, toCity, rd.intermediateStops, routeId);
    intermediates.forEach(s => {
      allStops.push(s);
      routeStopIds.splice(routeStopIds.length, 0, s.id);
      routePath.push(s.coordinates);
    });

    // To stop
    const toStop = stopIdMap.get(rd.to)!;
    toStop.connectedRoutes.push(routeId);
    routeStopIds.push(toStop.id);
    routePath.push(toStop.coordinates);

    // Calculate distance
    let totalDist = 0;
    for (let i = 1; i < routePath.length; i++) {
      const dLat = routePath[i].lat - routePath[i - 1].lat;
      const dLng = routePath[i].lng - routePath[i - 1].lng;
      totalDist += Math.sqrt(dLat * dLat + dLng * dLng) * 111; // rough km
    }

    const speedByType = { express: 50, superfast: 55, ordinary: 35, city: 25 };
    const duration = Math.round((totalDist / speedByType[rd.type]) * 60);

    const route: Route = {
      id: routeId,
      name: rd.name,
      shortName: rd.shortName,
      stops: routeStopIds,
      distanceKm: Math.round(totalDist),
      estimatedDurationMin: duration,
      type: rd.type,
      frequency: rd.type === 'city' ? 6 : rd.type === 'ordinary' ? 3 : 2,
      farePerKm: rd.type === 'superfast' ? 1.8 : rd.type === 'express' ? 1.5 : 1.0,
      color: ROUTE_COLORS[idx % ROUTE_COLORS.length],
      path: routePath,
    };
    allRoutes.push(route);
  });

  // Generate buses (100 buses)
  const buses: Bus[] = [];
  const busTypes: Array<Bus['type']> = ['standard', 'standard', 'standard', 'minibus', 'electric'];

  for (let i = 0; i < 100; i++) {
    const assignedRoute = allRoutes[i % allRoutes.length];
    const startStopIdx = rng.nextInt(0, assignedRoute.stops.length - 2);
    const startStop = allStops.find(s => s.id === assignedRoute.stops[startStopIdx]);
    const startPos = startStop?.coordinates || { lat: 11.0, lng: 76.1 };

    const busType = rng.pick(busTypes);
    const capacity = busType === 'minibus' ? 30 : busType === 'articulated' ? 80 : 50;

    buses.push({
      id: `bus-${(i + 1).toString().padStart(3, '0')}`,
      registrationNumber: `KL-${rng.nextInt(10, 70)}-${String.fromCharCode(65 + rng.nextInt(0, 25))}${String.fromCharCode(65 + rng.nextInt(0, 25))}-${rng.nextInt(1000, 9999)}`,
      type: busType,
      capacity,
      currentPassengers: rng.nextInt(0, Math.floor(capacity * 0.6)),
      assignedRouteId: assignedRoute.id,
      assignedDriverId: `driver-${(i + 1).toString().padStart(3, '0')}`,
      currentStopIndex: startStopIdx,
      nextStopIndex: startStopIdx + 1,
      currentPosition: { ...startPos },
      status: rng.next() > 0.15 ? 'in-service' : rng.pick(['at-stop', 'idle', 'standby']),
      delayMinutes: rng.next() > 0.7 ? rng.nextInt(1, 15) : 0,
      speedKmh: rng.nextInt(20, 55),
      fuelLevel: rng.nextFloat(0.3, 1.0),
      mileage: rng.nextInt(10000, 300000),
      age: rng.nextInt(1, 15),
      lastMaintenanceDate: '2026-07-15',
      maintenanceScore: rng.nextInt(40, 100),
      condition: rng.pick(['excellent', 'good', 'good', 'fair', 'poor']),
    });
  }

  // Generate drivers (120 drivers for 100 buses, some overlap)
  const drivers: Driver[] = [];
  const firstNames = ['Rajesh', 'Suresh', 'Anil', 'Vijay', 'Santhosh', 'Pradeep', 'Ramesh', 'Mohan', 'Ajith', 'Biju', 'Deepak', 'Gopan', 'Harikumar', 'Jayan', 'Krishnan', 'Lal', 'Manoj', 'Narayanan', 'Prasad', 'Rajan'];
  const lastNames = ['K', 'P', 'M', 'R', 'S', 'V', 'T', 'N', 'G', 'B'];

  for (let i = 0; i < 120; i++) {
    const shiftStarts = ['05:00', '06:00', '07:00', '13:00', '14:00', '15:00'];
    const shiftStart = rng.pick(shiftStarts);
    const shiftHour = parseInt(shiftStart.split(':')[0]);
    const shiftEnd = `${((shiftHour + 8) % 24).toString().padStart(2, '0')}:00`;

    drivers.push({
      id: `driver-${(i + 1).toString().padStart(3, '0')}`,
      name: `${rng.pick(firstNames)} ${rng.pick(lastNames)}`,
      licenseNumber: `KL${rng.nextInt(10, 99)}${rng.nextInt(10000, 99999)}`,
      experience: rng.nextInt(2, 25),
      shiftStart,
      shiftEnd,
      status: rng.next() > 0.15 ? 'on-duty' : rng.pick(['off-duty', 'on-break']),
      assignedBusId: i < 100 ? `bus-${(i + 1).toString().padStart(3, '0')}` : null,
      hoursWorkedToday: rng.nextFloat(0, 7),
      maxHoursPerDay: 8,
      rating: rng.nextFloat(3.0, 5.0),
    });
  }

  return { stops: allStops, routes: allRoutes, buses, drivers };
}
