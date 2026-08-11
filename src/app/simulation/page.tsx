'use client';

import { AppShell } from '@/components/layout/AppShell';
import React from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { cn, formatPercent } from '@/lib/utils';
import { EVENT_PRESETS } from '@/lib/constants';
import { Zap, Play, X, ArrowRight, BarChart3 } from 'lucide-react';

export default function SimulationPage() {
  const {
    simulation, metrics, snapshotMetrics, strategies,
    injectEvent, removeEvent, takeSnapshot, runOptimization, applyStrategy,
    togglePlayPause,
  } = useAppStore();

  const handleScenario = (presetIndex: number) => {
    takeSnapshot();
    injectEvent(presetIndex);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Digital Twin / Simulator</h1>
            <p className="text-sm text-gray-400 mt-1">Virtual simulation of the transport network</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayPause}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                simulation.isPaused
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
              )}
            >
              <Play className="w-4 h-4" />
              {simulation.isPaused ? 'Start Simulation' : 'Pause Simulation'}
            </button>
          </div>
        </div>

        {/* Scenario Buttons */}
        <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">🎭 Inject Event / Scenario</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {EVENT_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleScenario(idx)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-800/50 bg-gray-800/30 hover:bg-gray-800/60 hover:border-gray-700 transition-all group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{preset.icon}</span>
                <span className="text-xs font-medium text-gray-300">{preset.title.replace(/^[^\s]+\s/, '')}</span>
                <span className="text-[10px] text-gray-500">
                  Demand: {preset.demandMultiplier > 1 ? '+' : ''}{Math.round((preset.demandMultiplier - 1) * 100)}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Events */}
        {simulation.activeEvents.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h3 className="text-sm font-medium text-amber-400 mb-3">Active Events</h3>
            <div className="flex flex-wrap gap-2">
              {simulation.activeEvents.map(event => (
                <div key={event.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-800/50">
                  <span>{event.icon}</span>
                  <span className="text-sm text-white">{event.title}</span>
                  <button
                    onClick={() => removeEvent(event.id)}
                    className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center hover:bg-red-500/50 transition-all"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Before / After Comparison */}
        {snapshotMetrics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Before */}
            <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
              <h3 className="text-sm font-medium text-red-400 mb-4">⬅ BEFORE</h3>
              <div className="space-y-3">
                <MetricRow label="Avg Waiting" value={`${snapshotMetrics.avgWaitingTime} min`} />
                <MetricRow label="Overcrowded" value={`${snapshotMetrics.overcrowdedServices} routes`} />
                <MetricRow label="Missed Connections" value={`${snapshotMetrics.missedConnections}`} />
                <MetricRow label="Health Score" value={`${snapshotMetrics.networkHealthScore}/100`} />
              </div>
            </div>

            {/* Current */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <h3 className="text-sm font-medium text-amber-400 mb-4">🔥 AFTER EVENT</h3>
              <div className="space-y-3">
                <MetricRow label="Avg Waiting" value={`${metrics.avgWaitingTime} min`} change={metrics.avgWaitingTime - snapshotMetrics.avgWaitingTime} bad />
                <MetricRow label="Overcrowded" value={`${metrics.overcrowdedServices} routes`} change={metrics.overcrowdedServices - snapshotMetrics.overcrowdedServices} bad />
                <MetricRow label="Missed Connections" value={`${metrics.missedConnections}`} change={metrics.missedConnections - snapshotMetrics.missedConnections} bad />
                <MetricRow label="Health Score" value={`${metrics.networkHealthScore}/100`} change={metrics.networkHealthScore - snapshotMetrics.networkHealthScore} />
              </div>
            </div>

            {/* AI Optimization */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
              <h3 className="text-sm font-medium text-blue-400 mb-4">✨ AFTER AI OPTIMIZATION</h3>
              {strategies.length > 0 ? (
                <div className="space-y-3">
                  {strategies.filter(s => s.isRecommended).map(s => (
                    <React.Fragment key={s.id}>
                      <MetricRow label="Strategy" value={s.name} />
                      <MetricRow label="Waiting Change" value={`${s.metrics.waitingTimeChange.toFixed(1)}%`} />
                      <MetricRow label="Occupancy After" value={formatPercent(s.metrics.occupancyAfter)} />
                      <MetricRow label="Score" value={`${s.score}/100`} />
                      <button
                        onClick={() => applyStrategy(s.id)}
                        className="w-full mt-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold hover:shadow-lg transition-all"
                      >
                        Apply to Simulation
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <button
                    onClick={runOptimization}
                    className="px-4 py-2.5 rounded-xl bg-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-all"
                  >
                    <Zap className="w-4 h-4 inline mr-1" />
                    Run AI Optimizer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!snapshotMetrics && (
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-3">Ready to Simulate</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              Click a scenario button above to inject an event. The system will take a snapshot of current conditions, then show you the before/after impact.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
              <span>1. Inject Event</span>
              <ArrowRight className="w-3 h-3" />
              <span>2. See Impact</span>
              <ArrowRight className="w-3 h-3" />
              <span>3. Run Optimizer</span>
              <ArrowRight className="w-3 h-3" />
              <span>4. Compare Strategies</span>
              <ArrowRight className="w-3 h-3" />
              <span>5. Apply Best</span>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function MetricRow({ label, value, change, bad }: { label: string; value: string; change?: number; bad?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">{value}</span>
        {change !== undefined && change !== 0 && (
          <span className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded',
            bad
              ? (change > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400')
              : (change > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')
          )}>
            {change > 0 ? '+' : ''}{typeof change === 'number' ? change.toFixed(1) : change}
          </span>
        )}
      </div>
    </div>
  );
}
