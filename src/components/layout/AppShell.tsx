'use client';

import React, { useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppStore } from '@/lib/stores/app-store';
import { SIM_TICK_INTERVAL_MS } from '@/lib/constants';

import { DemoController } from '@/components/presentation/DemoController';

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    isDataLoaded,
    loadDemoData,
    tick,
    simulation,
    isDarkMode,
  } = useAppStore();

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load demo data on mount
  useEffect(() => {
    if (!isDataLoaded) {
      loadDemoData();
    }
  }, [isDataLoaded, loadDemoData]);

  // Simulation loop
  useEffect(() => {
    if (simulation.isRunning && !simulation.isPaused) {
      const interval = SIM_TICK_INTERVAL_MS / simulation.speed;
      tickRef.current = setInterval(() => {
        tick();
      }, interval);
    }

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [simulation.isRunning, simulation.isPaused, simulation.speed, tick]);

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden relative">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-auto p-6 bg-gray-950">
            {isDataLoaded ? (
              children
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Loading TRANSOPT AI...</p>
                </div>
              </div>
            )}
          </main>
        </div>
        {/* Presentation Mode overlay */}
        {isDataLoaded && <DemoController />}
      </div>
    </div>
  );
}
