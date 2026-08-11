'use client';

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '@/lib/stores/app-store';
import { MAP_CENTER, MAP_ZOOM, MAP_TILE_URL, MAP_ATTRIBUTION } from '@/lib/constants';
import { cn, formatPercent } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue in Next.js
const createBusIcon = (color: string, isDelayed: boolean) => {
  return L.divIcon({
    className: 'custom-bus-icon',
    html: `<div style="
      width: 24px; height: 24px;
      background: ${color};
      border: 2px solid ${isDelayed ? '#ef4444' : '#fff'};
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; color: white; font-weight: bold;
      box-shadow: 0 2px 8px ${color}60;
      ${isDelayed ? 'animation: pulse 1.5s infinite;' : ''}
    ">🚌</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const stopIcon = L.divIcon({
  className: 'custom-stop-icon',
  html: `<div style="
    width: 8px; height: 8px;
    background: #6b7280;
    border: 1.5px solid #374151;
    border-radius: 50%;
  "></div>`,
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

const transferIcon = L.divIcon({
  className: 'custom-transfer-icon',
  html: `<div style="
    width: 14px; height: 14px;
    background: #8b5cf6;
    border: 2px solid #a78bfa;
    border-radius: 50%;
    box-shadow: 0 0 8px #8b5cf640;
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function NetworkMap() {
  const { buses, routes, stops, simulation, metrics } = useAppStore();

  const activeBuses = useMemo(() =>
    buses.filter(b => b.status === 'in-service' || b.status === 'at-stop'),
    [buses]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Network</h1>
          <p className="text-sm text-gray-400 mt-1">
            {activeBuses.length} buses active • {routes.length} routes • {stops.length} stops
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>On-time</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span>Delayed</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span>Transfer Stop</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800/50 overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        <MapContainer
          center={[MAP_CENTER.lat, MAP_CENTER.lng]}
          zoom={MAP_ZOOM}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution={MAP_ATTRIBUTION}
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Route polylines */}
          {routes.map(route => (
            <Polyline
              key={route.id}
              positions={route.path.map(c => [c.lat, c.lng])}
              color={route.color}
              weight={2.5}
              opacity={0.6}
            />
          ))}

          {/* Stop markers */}
          {stops.map(stop => (
            <Marker
              key={stop.id}
              position={[stop.coordinates.lat, stop.coordinates.lng]}
              icon={stop.isTransferPoint ? transferIcon : stopIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-white">{stop.name}</p>
                  <p className="text-gray-400 text-xs">{stop.zone} • {stop.shelterType} shelter</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Avg daily: {stop.avgDailyPassengers} passengers
                  </p>
                  <p className="text-gray-400 text-xs">
                    Routes: {stop.connectedRoutes.length}
                  </p>
                  {stop.isTransferPoint && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-violet-500/20 text-violet-300 text-[10px] rounded">
                      Transfer Point
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Bus markers */}
          {activeBuses.map(bus => {
            const route = routes.find(r => r.id === bus.assignedRouteId);
            const occupancy = (bus.currentPassengers / bus.capacity) * 100;
            const isDelayed = bus.delayMinutes > 3;
            const color = occupancy > 85 ? '#ef4444' : occupancy > 60 ? '#f59e0b' : '#10b981';

            return (
              <Marker
                key={bus.id}
                position={[bus.currentPosition.lat, bus.currentPosition.lng]}
                icon={createBusIcon(color, isDelayed)}
              >
                <Popup>
                  <div className="text-sm min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-white text-base">{bus.id.toUpperCase()}</p>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                        occupancy > 85 ? "bg-red-500/20 text-red-300" :
                        occupancy > 60 ? "bg-amber-500/20 text-amber-300" :
                        "bg-emerald-500/20 text-emerald-300"
                      )}>
                        {Math.round(occupancy)}% full
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Route:</span>
                        <span className="text-white font-medium">{route?.shortName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Passengers:</span>
                        <span className="text-white">{bus.currentPassengers}/{bus.capacity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Delay:</span>
                        <span className={isDelayed ? "text-red-400 font-semibold" : "text-emerald-400"}>
                          {isDelayed ? `+${Math.round(bus.delayMinutes)} min` : 'On time'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-white capitalize">{bus.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white capitalize">{bus.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Seat Prob:</span>
                        <span className="text-blue-400">{Math.round(Math.max(0, (1 - occupancy/100) * 100))}%</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
