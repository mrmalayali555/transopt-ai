'use client';

import React from 'react';
import {
  Bus, Clock, Users, AlertTriangle, TrendingUp, DollarSign,
  Activity, Gauge, GitBranch, CheckCircle2, XCircle, Eye,
  Zap, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { useAppStore } from '@/lib/stores/app-store';
import { cn, formatTime, formatCurrency, formatPercent } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// --- KPI Card ---
function KPICard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  trendLabel,
  color = 'blue',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendLabel?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'violet' | 'cyan';
}) {
  const colorMap = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
    red: 'from-red-500/10 to-red-600/5 border-red-500/20',
    violet: 'from-violet-500/10 to-violet-600/5 border-violet-500/20',
    cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20',
  };

  const iconColorMap = {
    blue: 'text-blue-400 bg-blue-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/20',
    red: 'text-red-400 bg-red-500/20',
    violet: 'text-violet-400 bg-violet-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/20',
  };

  return (
    <div className={cn(
      'rounded-xl border bg-gradient-to-br p-4 transition-all hover:scale-[1.02]',
      colorMap[color]
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', iconColorMap[color])}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> :
             trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {trendLabel}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">
        {value}{unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

// --- Network Health Gauge ---
function NetworkHealthGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-6 text-center">
      <h3 className="text-sm font-medium text-gray-400 mb-4">AI Network Health</h3>
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * 327} 327`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>
      <span
        className="inline-block px-3 py-1 rounded-full text-xs font-bold"
        style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
      >
        {label}
      </span>
    </div>
  );
}

// --- AI Recommendation Card ---
function RecommendationCard({
  recommendation,
  onAccept,
  onIgnore,
  onSimulate,
}: {
  recommendation: {
    id: string;
    severity: string;
    title: string;
    reason: string;
    expectedImpact: string;
    confidence: number;
    recommendedAction: string;
    status: string;
  };
  onAccept: () => void;
  onIgnore: () => void;
  onSimulate: () => void;
}) {
  const severityConfig: Record<string, { icon: string; color: string; bg: string }> = {
    critical: { icon: '🔴', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    warning: { icon: '🟡', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    info: { icon: '🟢', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  };

  const config = severityConfig[recommendation.severity] || severityConfig.info;

  if (recommendation.status !== 'pending') return null;

  return (
    <div className={cn('rounded-lg border p-4 transition-all', config.bg)}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold mb-1', config.color)}>{recommendation.title}</p>
          <p className="text-xs text-gray-400 mb-2">{recommendation.reason}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Impact: {recommendation.expectedImpact}</span>
            <span>•</span>
            <span>Confidence: {Math.round(recommendation.confidence * 100)}%</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onAccept}
              className="px-3 py-1.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-all flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" /> Accept
            </button>
            <button
              onClick={onSimulate}
              className="px-3 py-1.5 rounded-md bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-all flex items-center gap-1"
            >
              <Eye className="w-3 h-3" /> Simulate
            </button>
            <button
              onClick={onIgnore}
              className="px-3 py-1.5 rounded-md bg-gray-700/50 text-gray-400 text-xs font-medium hover:bg-gray-700 transition-all flex items-center gap-1"
            >
              <XCircle className="w-3 h-3" /> Ignore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Dashboard ---
export default function DashboardPage() {
  const {
    metrics, recommendations, simulation, metricsHistory,
    buses, routes,
    acceptRecommendation, ignoreRecommendation, runOptimization,
  } = useAppStore();

  // Occupancy distribution for pie chart
  const occData = [
    { name: 'Low (<50%)', value: buses.filter(b => (b.currentPassengers / b.capacity) < 0.5).length, color: '#10b981' },
    { name: 'Normal (50-85%)', value: buses.filter(b => { const o = b.currentPassengers / b.capacity; return o >= 0.5 && o < 0.85; }).length, color: '#3b82f6' },
    { name: 'High (>85%)', value: buses.filter(b => (b.currentPassengers / b.capacity) >= 0.85).length, color: '#ef4444' },
  ];

  // Metrics history for chart
  const chartData = metricsHistory.slice(-30).map((m, i) => ({
    time: i,
    waiting: m.avgWaitingTime,
    occupancy: m.avgOccupancy,
    health: m.networkHealthScore,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time network intelligence overview</p>
        </div>
        <button
          onClick={runOptimization}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/20 transition-all"
        >
          <Zap className="w-4 h-4" />
          Run Optimizer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard icon={Bus} label="Active Buses" value={metrics.activeBuses} unit={`/ ${metrics.totalBuses}`} color="blue" trend="stable" trendLabel="" />
        <KPICard icon={AlertTriangle} label="Delayed Buses" value={metrics.delayedBuses} color={metrics.delayedBuses > 10 ? 'red' : 'amber'} trend={metrics.delayedBuses > 10 ? 'up' : 'stable'} trendLabel={metrics.delayedBuses > 10 ? 'High' : ''} />
        <KPICard icon={Users} label="Passenger Demand" value={metrics.totalPassengerDemand.toLocaleString()} color="violet" />
        <KPICard icon={Clock} label="Avg Wait Time" value={metrics.avgWaitingTime} unit="min" color={metrics.avgWaitingTime > 15 ? 'red' : 'emerald'} />
        <KPICard icon={Gauge} label="Avg Occupancy" value={formatPercent(metrics.avgOccupancy, 0)} color={metrics.avgOccupancy > 85 ? 'red' : metrics.avgOccupancy > 70 ? 'amber' : 'emerald'} />
        <KPICard icon={AlertTriangle} label="Overcrowded" value={metrics.overcrowdedServices} unit="services" color={metrics.overcrowdedServices > 5 ? 'red' : 'amber'} />
        <KPICard icon={GitBranch} label="Missed Connections" value={metrics.missedConnections} color={metrics.missedConnections > 15 ? 'red' : 'amber'} />
        <KPICard icon={DollarSign} label="Operating Cost" value={formatCurrency(metrics.estimatedOperatingCost)} color="cyan" />
        <KPICard icon={TrendingUp} label="Fleet Utilization" value={formatPercent(metrics.fleetUtilization, 0)} color="blue" />
        <KPICard icon={Activity} label="On-Time Performance" value={formatPercent(metrics.onTimePerformance, 0)} color={metrics.onTimePerformance > 80 ? 'emerald' : 'amber'} />
      </div>

      {/* Middle Row: Health + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Network Health */}
        <div className="lg:col-span-3">
          <NetworkHealthGauge score={metrics.networkHealthScore} label={metrics.networkHealthLabel} />
        </div>

        {/* Trend Charts */}
        <div className="lg:col-span-5 rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Network Trends</h3>
          {chartData.length > 2 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="waitingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" tick={false} stroke="#374151" />
                <YAxis stroke="#374151" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 8 }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="waiting" stroke="#f59e0b" fill="url(#waitingGrad)" name="Waiting (min)" />
                <Area type="monotone" dataKey="health" stroke="#10b981" fill="url(#healthGrad)" name="Health Score" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">
              <p>Press Play ▶ to start the simulation and see trends</p>
            </div>
          )}
        </div>

        {/* Occupancy Distribution */}
        <div className="lg:col-span-4 rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Occupancy Distribution</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={occData}
                  cx="50%" cy="50%"
                  innerRadius={35} outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {occData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {occData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-400">{d.name}</span>
                  <span className="font-semibold text-white ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            AI Recommendations
          </h3>
          <span className="text-xs text-gray-500">
            {recommendations.filter(r => r.status === 'pending').length} pending
          </span>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {recommendations.filter(r => r.status === 'pending').length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pending recommendations</p>
              <p className="text-xs mt-1">Start the simulation to receive AI insights</p>
            </div>
          ) : (
            recommendations
              .filter(r => r.status === 'pending')
              .slice(0, 5)
              .map(rec => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onAccept={() => acceptRecommendation(rec.id)}
                  onIgnore={() => ignoreRecommendation(rec.id)}
                  onSimulate={() => runOptimization()}
                />
              ))
          )}
        </div>
      </div>

      {/* Active Events */}
      {simulation.activeEvents.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h3 className="text-sm font-medium text-amber-400 mb-3">🚨 Active Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {simulation.activeEvents.map(event => (
              <div
                key={event.id}
                className="rounded-lg bg-gray-900/50 border border-gray-800/50 p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{event.icon}</span>
                  <span className="text-sm font-semibold text-white">{event.title}</span>
                </div>
                <p className="text-xs text-gray-400">{event.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>Demand: {event.demandMultiplier > 1 ? '+' : ''}{Math.round((event.demandMultiplier - 1) * 100)}%</span>
                  <span>Delay: {event.delayMultiplier > 1 ? '+' : ''}{Math.round((event.delayMultiplier - 1) * 100)}%</span>
                  <span>Routes: {event.affectedRoutes.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
