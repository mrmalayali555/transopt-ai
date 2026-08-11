'use client';

import { AppShell } from '@/components/layout/AppShell';
import React from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { cn } from '@/lib/utils';
import { Wrench, ShieldAlert, Calendar, Activity, PenTool as Tool, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function MaintenancePage() {
  const { buses, maintenancePredictions } = useAppStore();

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#10b981';
    }
  };

  // Group predictions by risk level
  const highRisk = maintenancePredictions.filter(p => p.riskLevel === 'high');
  const medRisk = maintenancePredictions.filter(p => p.riskLevel === 'medium');
  const lowRisk = maintenancePredictions.filter(p => p.riskLevel === 'low');

  // Chart data
  const chartData = [
    { name: 'High Risk', count: highRisk.length, fill: '#ef4444' },
    { name: 'Medium Risk', count: medRisk.length, fill: '#f59e0b' },
    { name: 'Low Risk', count: lowRisk.length, fill: '#10b981' },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Predictive Maintenance</h1>
          <p className="text-sm text-gray-400 mt-1">AI-driven fleet health monitoring & breakdown prediction</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
            <Wrench className="w-5 h-5 text-blue-400 mb-2" />
            <div className="text-2xl font-bold text-white">{buses.length}</div>
            <div className="text-xs text-gray-400">Total Fleet</div>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <ShieldAlert className="w-5 h-5 text-red-400 mb-2" />
            <div className="text-2xl font-bold text-red-400">{highRisk.length}</div>
            <div className="text-xs text-red-400">High Risk Buses</div>
          </div>
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
            <Activity className="w-5 h-5 text-violet-400 mb-2" />
            <div className="text-2xl font-bold text-white">
              {Math.round(maintenancePredictions.reduce((s, p) => s + p.riskScore, 0) / Math.max(1, buses.length))}/100
            </div>
            <div className="text-xs text-gray-400">Avg Risk Score</div>
          </div>
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
            <Calendar className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-2xl font-bold text-white">{highRisk.length + medRisk.length}</div>
            <div className="text-xs text-gray-400">Action Required</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Distribution Chart */}
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} stroke="#374151" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 8 }}
                  itemStyle={{ color: '#f3f4f6' }}
                  cursor={{ fill: '#1f2937', opacity: 0.4 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* High Risk Alerts */}
          <div className="lg:col-span-2 rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                High Priority Alerts
              </h3>
            </div>
            <div className="space-y-3">
              {highRisk.length > 0 ? highRisk.map(pred => {
                const bus = buses.find(b => b.id === pred.busId);
                return (
                  <div key={pred.busId} className="flex gap-4 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-red-500/10 border border-red-500/20 min-w-[80px]">
                      <span className="text-2xl font-bold text-red-400">{pred.riskScore}</span>
                      <span className="text-[10px] text-red-400 font-semibold uppercase">Risk Score</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-base font-bold text-white">Bus {pred.busId.toUpperCase()}</h4>
                        <span className="text-xs text-red-400 font-medium">Schedule Immediate Inspection</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                        {pred.factors.map((f, i) => (
                          <div key={i} className="text-xs">
                            <div className="text-gray-500">{f.name}</div>
                            <div className="text-gray-300">{f.description}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Tool className="w-3.5 h-3.5" />
                        <span>AI Recommendation: {pred.recommendedAction}</span>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-gray-600">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No high-risk vehicles detected</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Medium Risk Watchlist */}
        {medRisk.length > 0 && (
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Watchlist (Medium Risk)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {medRisk.map(pred => (
                <div key={pred.busId} className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Bus {pred.busId.toUpperCase()}</div>
                    <div className="text-xs text-gray-500">Risk Score: {pred.riskScore}</div>
                  </div>
                  <button className="px-3 py-1.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all">
                    Schedule Maintenance
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
