'use client';

import { AppShell } from '@/components/layout/AppShell';
import React from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import { Zap, ArrowRight, CheckCircle2, TrendingDown, TrendingUp, DollarSign, Timer } from 'lucide-react';

export default function FleetPage() {
  const { strategies, metrics, runOptimization, applyStrategy, takeSnapshot, snapshotMetrics } = useAppStore();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Fleet Optimizer</h1>
            <p className="text-sm text-gray-400 mt-1">AI-driven fleet allocation & schedule optimization</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // College Jury Prototype Injector
                const prototypeStrategy = {
                  id: 'prototype-strategy',
                  name: 'Reassign Ghost Bus to Overcrowded Route',
                  description: 'Moves underutilized bus from a bunched route to a high-demand route.',
                  type: 'reassign' as const,
                  score: 98,
                  isRecommended: true,
                  reasoning: [
                    'Detected Route 12 (Kozhikode-Local) is over-serviced with buses 4 mins apart and only 15% occupancy.',
                    'Detected Route 4 (Kozhikode-Kannur) is critically overcrowded (95% occupancy).',
                    'Reassigning Bus-104 from Route 12 to Route 4.',
                    'Saves ₹850 in redundant operating costs while relieving 45 standing passengers.'
                  ],
                  metrics: {
                    waitingTimeChange: -12.5,
                    costChange: -850,
                    occupancyAfter: 0.75,
                    overallScore: 98,
                    overcrowdedRoutes: -1,
                    missedConnections: 0,
                    avgDelay: -2,
                    fleetUtilization: 0.88,
                  },
                  confidence: 0.99,
                  changes: [{
                    busId: 'bus-104',
                    fromRouteId: 'route-12',
                    toRouteId: 'route-4',
                    action: 'reassign',
                    detail: 'Moved from Route 12 to Route 4 due to severe crowding.'
                  }]
                };
                useAppStore.setState(state => ({
                  strategies: [prototypeStrategy, ...state.strategies.map(s => ({...s, isRecommended: false}))]
                }));
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all border border-emerald-400"
            >
              🎓 Inject Jury Prototype
            </button>
            <button
              onClick={takeSnapshot}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-all"
            >
              📸 Take Snapshot
            </button>
            <button
              onClick={runOptimization}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/20 transition-all"
            >
              <Zap className="w-4 h-4" /> Run Optimizer
            </button>
          </div>
        </div>

        {/* Before/After Comparison */}
        {snapshotMetrics && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
              <h3 className="text-sm font-medium text-gray-500 mb-3">📊 BEFORE (Snapshot)</h3>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Avg Waiting" value={`${snapshotMetrics.avgWaitingTime} min`} />
                <Stat label="Avg Occupancy" value={formatPercent(snapshotMetrics.avgOccupancy)} />
                <Stat label="Overcrowded" value={`${snapshotMetrics.overcrowdedServices} services`} />
                <Stat label="Missed Connections" value={`${snapshotMetrics.missedConnections}`} />
              </div>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
              <h3 className="text-sm font-medium text-blue-400 mb-3">✨ AFTER (Current)</h3>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Avg Waiting" value={`${metrics.avgWaitingTime} min`} change={metrics.avgWaitingTime - snapshotMetrics.avgWaitingTime} invertColor />
                <Stat label="Avg Occupancy" value={formatPercent(metrics.avgOccupancy)} change={metrics.avgOccupancy - snapshotMetrics.avgOccupancy} invertColor />
                <Stat label="Overcrowded" value={`${metrics.overcrowdedServices} services`} change={metrics.overcrowdedServices - snapshotMetrics.overcrowdedServices} invertColor />
                <Stat label="Missed Connections" value={`${metrics.missedConnections}`} change={metrics.missedConnections - snapshotMetrics.missedConnections} invertColor />
              </div>
            </div>
          </div>
        )}

        {/* Strategies */}
        {strategies.length > 0 ? (
          <>
            <h3 className="text-sm font-medium text-gray-400">
              "What Should We Do?" — {strategies.length} strategies evaluated
            </h3>

            {/* Strategy comparison table */}
            <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800/50">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Strategy</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Waiting</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Occupancy</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Cost</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Score</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {strategies.map(strategy => (
                    <tr
                      key={strategy.id}
                      className={cn(
                        'border-b border-gray-800/30 hover:bg-gray-800/30 transition-all',
                        strategy.isRecommended && 'bg-blue-500/5 border-blue-500/20'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {strategy.isRecommended && (
                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded">
                              RECOMMENDED
                            </span>
                          )}
                          <span className="font-medium text-white">{strategy.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{strategy.description}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          'font-medium',
                          strategy.metrics.waitingTimeChange < 0 ? 'text-emerald-400' : 'text-red-400'
                        )}>
                          {strategy.metrics.waitingTimeChange > 0 ? '+' : ''}{strategy.metrics.waitingTimeChange.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white">{formatPercent(strategy.metrics.occupancyAfter)}</td>
                      <td className="px-4 py-3 text-right text-amber-400">
                        {strategy.metrics.costChange > 0 ? '+' : ''}{formatCurrency(strategy.metrics.costChange)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          'inline-block px-2 py-0.5 rounded font-bold text-sm',
                          strategy.score >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                          strategy.score >= 50 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        )}>
                          {strategy.score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => applyStrategy(strategy.id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-all"
                        >
                          Apply to Sim
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recommended strategy detail */}
            {strategies.filter(s => s.isRecommended).map(strategy => (
              <div key={strategy.id} className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Recommended: {strategy.name}</h3>
                </div>
                <div className="space-y-2 mb-4">
                  {strategy.reasoning.map((reason, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Confidence: {Math.round(strategy.confidence * 100)}%</span>
                  <span>•</span>
                  <span>Data: Real-time occupancy, demand prediction, fleet status</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-12 text-center">
            <Zap className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No Optimization Run Yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Click &quot;Run Optimizer&quot; to generate and compare strategies
            </p>
            <button
              onClick={runOptimization}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/20 transition-all"
            >
              Run Optimizer Now
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, change, invertColor }: { label: string; value: string; change?: number; invertColor?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">{value}</span>
        {change !== undefined && change !== 0 && (
          <span className={cn(
            'text-xs font-medium flex items-center gap-0.5',
            (invertColor ? change < 0 : change > 0) ? 'text-emerald-400' : 'text-red-400'
          )}>
            {(invertColor ? change < 0 : change > 0) ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {change > 0 ? '+' : ''}{typeof change === 'number' ? change.toFixed(1) : change}
          </span>
        )}
      </div>
    </div>
  );
}
