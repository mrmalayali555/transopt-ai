'use client';

import { AppShell } from '@/components/layout/AppShell';
import React from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { generateDemandChartData } from '@/lib/engine/predictor';
import { cn, formatPercent } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { TrendingUp, BarChart3, Clock, Target } from 'lucide-react';

export default function DemandPage() {
  const { routes, simulation, metrics, buses, stops } = useAppStore();

  // Generate demand chart data for top 6 routes
  const selectedRoutes = routes.slice(0, 6);

  const demandData = selectedRoutes.map(route => {
    const baseline = route.stops.length * 45;
    const data = generateDemandChartData(
      route.id, baseline, simulation.weather,
      simulation.activeEvents, simulation.currentDay
    );
    return { route, data };
  });

  // Aggregated hourly demand
  const aggregateData = Array.from({ length: 24 }, (_, hour) => {
    let totalPredicted = 0;
    let totalActual = 0;
    demandData.forEach(rd => {
      totalPredicted += rd.data[hour]?.predicted || 0;
      totalActual += rd.data[hour]?.actual || 0;
    });
    return { hour: `${hour}:00`, predicted: totalPredicted, actual: totalActual };
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Demand Intelligence</h1>
          <p className="text-sm text-gray-400 mt-1">AI-powered passenger demand prediction & analysis</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: TrendingUp, label: 'Current Demand', value: metrics.totalPassengerDemand.toLocaleString(), color: 'blue' },
            { icon: BarChart3, label: 'Peak Hour', value: '08:00 - 09:00', color: 'violet' },
            { icon: Clock, label: 'Prediction Window', value: '3 hours', color: 'cyan' },
            { icon: Target, label: 'Model Accuracy', value: '91.2%', color: 'emerald' },
          ].map((kpi, i) => (
            <div key={i} className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-4">
              <kpi.icon className={cn('w-5 h-5 mb-2', `text-${kpi.color}-400`)} />
              <div className="text-xl font-bold text-white">{kpi.value}</div>
              <div className="text-xs text-gray-400">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Aggregate demand chart */}
        <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Network-Wide Demand: Actual vs Predicted</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={aggregateData}>
              <defs>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="hour" stroke="#374151" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis stroke="#374151" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} />
              <Legend />
              <Area type="monotone" dataKey="predicted" stroke="#3b82f6" fill="url(#predGrad)" name="Predicted" />
              <Area type="monotone" dataKey="actual" stroke="#10b981" fill="url(#actGrad)" name="Actual" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Per-route demand cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {demandData.slice(0, 4).map(({ route, data }) => {
            const currentHour = Math.floor(simulation.currentTime / 60);
            const current = data[currentHour] || { predicted: 0, lower: 0, upper: 0, actual: 0 };

            return (
              <div key={route.id} className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{route.shortName}</h4>
                    <p className="text-xs text-gray-500">{route.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{current.predicted}</div>
                    <div className="text-[10px] text-gray-500">
                      Range: {current.lower} – {current.upper}
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={data}>
                    <XAxis dataKey="hour" tick={false} stroke="#374151" />
                    <YAxis tick={false} stroke="#374151" />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} />
                    <Bar dataKey="predicted" fill="#3b82f6" radius={[2, 2, 0, 0]} opacity={0.7} />
                    <Bar dataKey="actual" fill="#10b981" radius={[2, 2, 0, 0]} opacity={0.5} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
