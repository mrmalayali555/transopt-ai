'use client';

import { AppShell } from '@/components/layout/AppShell';
import React from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { cn } from '@/lib/utils';
import { AlertTriangle, Shield, Activity, Phone, Map, Users, Siren } from 'lucide-react';

const CRISIS_SCENARIOS = [
  { title: '🌊 Major Flood', desc: 'Low-lying areas flooded, multiple routes blocked', severity: 'critical' as const },
  { title: '⛰️ Landslide', desc: 'Hilly terrain road blocked, communities isolated', severity: 'critical' as const },
  { title: '🚂 Railway Disruption', desc: 'Train services cancelled, bus demand surges', severity: 'high' as const },
  { title: '🚧 Major Road Closure', desc: 'National highway blocked, traffic rerouted', severity: 'high' as const },
];

export default function CrisisPage() {
  const {
    simulation, metrics, toggleCrisisMode, injectEvent, takeSnapshot,
  } = useAppStore();

  const isCrisis = simulation.isCrisisMode;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Crisis Management</h1>
            <p className="text-sm text-gray-400 mt-1">Emergency operations & disaster response</p>
          </div>
        </div>

        {/* Big Crisis Button */}
        <div className={cn(
          'rounded-2xl border-2 p-8 text-center transition-all duration-500',
          isCrisis
            ? 'border-red-500 bg-red-500/10 crisis-border'
            : 'border-gray-800/50 bg-gray-900/50'
        )}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Siren className={cn('w-8 h-8', isCrisis ? 'text-red-500 animate-pulse' : 'text-gray-500')} />
            <h2 className={cn('text-2xl font-bold', isCrisis ? 'text-red-400' : 'text-gray-400')}>
              {isCrisis ? 'CRISIS MODE ACTIVE' : 'CRISIS MODE'}
            </h2>
            <Siren className={cn('w-8 h-8', isCrisis ? 'text-red-500 animate-pulse' : 'text-gray-500')} />
          </div>

          <p className="text-sm text-gray-400 mb-6 max-w-lg mx-auto">
            {isCrisis
              ? 'Optimization priorities changed: SAFETY > ACCESSIBILITY > EMERGENCY CONNECTIVITY > COST'
              : 'Activating crisis mode changes optimization priorities from cost-efficiency to passenger safety and emergency connectivity.'
            }
          </p>

          <button
            onClick={toggleCrisisMode}
            className={cn(
              'px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300',
              isCrisis
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-red-600 text-white hover:bg-red-500 hover:shadow-xl hover:shadow-red-500/30 animate-pulse-glow'
            )}
          >
            {isCrisis ? '🛑 DEACTIVATE CRISIS MODE' : '🚨 ACTIVATE CRISIS MODE'}
          </button>
        </div>

        {/* Crisis Priority Objectives */}
        {isCrisis && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
            {[
              { icon: Shield, label: 'Passenger Safety', priority: '#1', color: 'red' },
              { icon: Users, label: 'Accessibility', priority: '#2', color: 'amber' },
              { icon: Map, label: 'Emergency Routes', priority: '#3', color: 'blue' },
              { icon: Phone, label: 'Connectivity', priority: '#4', color: 'violet' },
            ].map((item, i) => (
              <div key={i} className={cn(
                'rounded-xl border p-4',
                `border-${item.color}-500/30 bg-${item.color}-500/10`
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className={cn('w-5 h-5', `text-${item.color}-400`)} />
                  <span className={cn('text-xs font-bold', `text-${item.color}-400`)}>{item.priority}</span>
                </div>
                <div className="text-sm font-semibold text-white">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Crisis Scenarios */}
        <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Crisis Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CRISIS_SCENARIOS.map((scenario, idx) => (
              <button
                key={idx}
                onClick={() => {
                  takeSnapshot();
                  // Map to closest event preset
                  const presetMap = [7, 8, 5, 2]; // flood, landslide, demand-surge, road-closure
                  injectEvent(presetMap[idx]);
                  if (!isCrisis) toggleCrisisMode();
                }}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-800/50 bg-gray-800/30 hover:bg-gray-800/60 hover:border-gray-700 transition-all text-left"
              >
                <span className="text-3xl">{scenario.title.split(' ')[0]}</span>
                <div>
                  <h4 className="text-sm font-semibold text-white">{scenario.title.replace(/^[^\s]+\s/, '')}</h4>
                  <p className="text-xs text-gray-400 mt-1">{scenario.desc}</p>
                  <span className={cn(
                    'inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold',
                    scenario.severity === 'critical'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-amber-500/20 text-amber-400'
                  )}>
                    {scenario.severity.toUpperCase()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5 text-center">
            <Activity className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{metrics.activeBuses}</div>
            <div className="text-xs text-gray-400">Buses Available</div>
          </div>
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5 text-center">
            <AlertTriangle className={cn('w-6 h-6 mx-auto mb-2', metrics.overcrowdedServices > 5 ? 'text-red-400' : 'text-amber-400')} />
            <div className="text-2xl font-bold text-white">{simulation.activeEvents.length}</div>
            <div className="text-xs text-gray-400">Active Disruptions</div>
          </div>
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5 text-center">
            <Users className="w-6 h-6 text-violet-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{metrics.totalPassengerDemand.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Passengers Affected</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
