'use client';

import { AppShell } from '@/components/layout/AppShell';
import React from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { cn, formatPercent, formatCurrency } from '@/lib/utils';
import { Route, TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function RoutesPage() {
  const { routes, buses, stops, metrics } = useAppStore();

  const routeData = routes.map(route => {
    const routeBuses = buses.filter(b => b.assignedRouteId === route.id);
    const totalPax = routeBuses.reduce((s, b) => s + b.currentPassengers, 0);
    const totalCap = routeBuses.reduce((s, b) => s + b.capacity, 0);
    const avgOcc = totalCap > 0 ? (totalPax / totalCap) * 100 : 0;
    const avgDelay = routeBuses.length > 0
      ? routeBuses.reduce((s, b) => s + b.delayMinutes, 0) / routeBuses.length : 0;
    const revenue = totalPax * route.farePerKm * route.distanceKm * 0.3;
    const cost = routeBuses.length * 850;
    const performance = Math.round(Math.max(0, Math.min(100, 70 + (totalPax / Math.max(1, totalCap)) * 30 - avgDelay * 2)));

    let diagnosis = '';
    let recommendation = '';
    if (avgOcc > 85) {
      diagnosis = 'Overcrowded — demand exceeds capacity';
      recommendation = 'Add bus or increase frequency during peak hours';
    } else if (avgOcc < 30) {
      diagnosis = 'Underutilized — low demand relative to capacity';
      recommendation = 'Reduce frequency during off-peak or reassign buses';
    } else if (avgDelay > 8) {
      diagnosis = 'High delays — traffic or operational issues';
      recommendation = 'Investigate delay causes, consider express service';
    } else {
      diagnosis = 'Operating within normal parameters';
      recommendation = 'Continue current schedule';
    }

    return {
      ...route, busCount: routeBuses.length, avgOcc, avgDelay,
      totalPax, revenue: Math.round(revenue), cost, performance,
      diagnosis, recommendation,
    };
  }).sort((a, b) => b.performance - a.performance);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Route Intelligence</h1>
          <p className="text-sm text-gray-400 mt-1">Performance analysis & AI diagnosis for all routes</p>
        </div>

        {/* Route performance chart */}
        <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Route Performance Scores</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={routeData.slice(0, 15)}>
              <XAxis dataKey="shortName" stroke="#374151" tick={{ fill: '#6b7280', fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
              <YAxis stroke="#374151" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} />
              <Bar dataKey="performance" name="Score" radius={[4, 4, 0, 0]}>
                {routeData.slice(0, 15).map((entry, idx) => (
                  <rect key={idx} fill={entry.performance >= 70 ? '#10b981' : entry.performance >= 50 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Route cards */}
        <div className="space-y-3">
          {routeData.map(route => (
            <div key={route.id} className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5 hover:border-gray-700/50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }} />
                    <h4 className="text-sm font-semibold text-white">{route.shortName}</h4>
                    <span className="text-xs text-gray-500">{route.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{route.type}</span>
                    <span>•</span>
                    <span>{route.distanceKm} km</span>
                    <span>•</span>
                    <span>{route.stops.length} stops</span>
                    <span>•</span>
                    <span>{route.busCount} buses</span>
                  </div>
                </div>
                <span className={cn(
                  'px-2.5 py-1 rounded-lg text-sm font-bold',
                  route.performance >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                  route.performance >= 50 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                )}>
                  {route.performance}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-4 mb-3 text-xs">
                <div>
                  <span className="text-gray-500">Occupancy</span>
                  <div className={cn('font-semibold', route.avgOcc > 85 ? 'text-red-400' : 'text-white')}>
                    {formatPercent(route.avgOcc)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Passengers</span>
                  <div className="font-semibold text-white">{route.totalPax}</div>
                </div>
                <div>
                  <span className="text-gray-500">Avg Delay</span>
                  <div className={cn('font-semibold', route.avgDelay > 5 ? 'text-amber-400' : 'text-white')}>
                    {route.avgDelay.toFixed(1)} min
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Revenue</span>
                  <div className="font-semibold text-emerald-400">{formatCurrency(route.revenue)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Cost</span>
                  <div className="font-semibold text-amber-400">{formatCurrency(route.cost)}</div>
                </div>
              </div>

              {/* AI Diagnosis */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-800/40">
                <Lightbulb className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="text-gray-400">AI Diagnosis: </span>
                  <span className="text-gray-300">{route.diagnosis}</span>
                  <br />
                  <span className="text-gray-400">Recommendation: </span>
                  <span className="text-blue-400">{route.recommendation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
