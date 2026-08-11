'use client';

import { AppShell } from '@/components/layout/AppShell';
import React from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { cn, formatPercent } from '@/lib/utils';
import { GitBranch, AlertTriangle, Clock, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ConnectionsPage() {
  const { connections, buses, routes, stops } = useAppStore();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Connection Intelligence</h1>
          <p className="text-sm text-gray-400 mt-1">Missed connection prediction & transfer optimization</p>
        </div>

        {/* At-risk connections */}
        <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-violet-400" />
            Active Connections ({connections.length} monitored)
          </h3>
          {connections.length > 0 ? (
            <div className="space-y-3">
              {connections.slice(0, 8).map(conn => {
                const fromRoute = routes.find(r => r.id === conn.fromRouteId);
                const toRoute = routes.find(r => r.id === conn.toRouteId);
                const stop = stops.find(s => s.id === conn.transferStopId);

                return (
                  <div key={conn.id} className={cn(
                    'rounded-lg border p-4 transition-all',
                    conn.status === 'at-risk' ? 'border-red-500/20 bg-red-500/5' :
                    conn.status === 'missed' ? 'border-red-600/30 bg-red-600/10' :
                    'border-gray-800/50 bg-gray-800/20'
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold',
                          conn.status === 'at-risk' ? 'bg-red-500/20 text-red-400' :
                          conn.status === 'missed' ? 'bg-red-600/20 text-red-500' :
                          'bg-emerald-500/20 text-emerald-400'
                        )}>
                          {conn.status.toUpperCase().replace('-', ' ')}
                        </span>
                        <span className="text-sm font-medium text-white">
                          {stop?.name || 'Transfer Point'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Missed probability: {Math.round(conn.missedProbability * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">From:</span>
                        <span className="font-medium text-white">{conn.fromBusId}</span>
                        <span className="text-gray-500">({fromRoute?.shortName})</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-gray-600" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">To:</span>
                        <span className="font-medium text-white">{conn.toBusId}</span>
                        <span className="text-gray-500">({toRoute?.shortName})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {conn.transferringPassengers} transferring</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Buffer: {conn.bufferMinutes.toFixed(1)} min</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">All connections are currently safe</p>
              <p className="text-xs mt-1">Start the simulation to monitor live connections</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
