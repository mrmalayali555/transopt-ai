'use client';

import React from 'react';
import {
  Play, Pause, RotateCcw, FastForward, Bell, Sun, Moon,
  Cloud, CloudRain, CloudLightning, CloudFog, Cpu, Wifi
} from 'lucide-react';
import { useAppStore } from '@/lib/stores/app-store';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function Topbar() {
  const {
    simulation, metrics, recommendations,
    togglePlayPause, setSpeed, resetSimulation,
    isDarkMode, toggleDarkMode,
  } = useAppStore();

  const pendingAlerts = recommendations.filter(r => r.status === 'pending').length;

  const weatherIcons: Record<string, React.ReactNode> = {
    'clear': <Sun className="w-4 h-4 text-amber-400" />,
    'cloudy': <Cloud className="w-4 h-4 text-gray-400" />,
    'light-rain': <CloudRain className="w-4 h-4 text-blue-400" />,
    'heavy-rain': <CloudRain className="w-4 h-4 text-blue-500" />,
    'storm': <CloudLightning className="w-4 h-4 text-yellow-400" />,
    'fog': <CloudFog className="w-4 h-4 text-gray-400" />,
  };

  return (
    <header className={cn(
      "h-14 border-b flex items-center justify-between px-5 shrink-0",
      simulation.isCrisisMode
        ? "bg-red-950/50 border-red-800/50"
        : "bg-gray-900/60 border-gray-800/50"
    )}>
      {/* Left: Simulation Controls */}
      <div className="flex items-center gap-4">
        {/* Sim Clock */}
        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-1.5">
          <div className={cn(
            "w-2 h-2 rounded-full",
            simulation.isRunning && !simulation.isPaused
              ? "bg-emerald-500 animate-pulse"
              : "bg-gray-500"
          )} />
          <span className="text-sm font-mono font-bold text-white">
            {formatTime(simulation.currentTime)}
          </span>
          <span className="text-xs text-gray-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][simulation.currentDay]}
          </span>
        </div>

        {/* Play/Pause */}
        <div className="flex items-center gap-1">
          <button
            onClick={togglePlayPause}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              simulation.isPaused
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
            )}
            title={simulation.isPaused ? 'Play' : 'Pause'}
          >
            {simulation.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Speed buttons */}
          {([1, 2, 5] as const).map(speed => (
            <button
              key={speed}
              onClick={() => setSpeed(speed)}
              className={cn(
                "px-2 py-1 rounded text-xs font-bold transition-all",
                simulation.speed === speed
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              {speed}x
            </button>
          ))}

          <button
            onClick={resetSimulation}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-all"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Status Chips */}
      <div className="flex items-center gap-3">
        {/* Network Status */}
        <div className="flex items-center gap-2 text-xs">
          <Wifi className={cn("w-3.5 h-3.5", metrics.networkHealthScore >= 70 ? "text-emerald-400" : "text-amber-400")} />
          <span className="text-gray-400">Network:</span>
          <span className={cn(
            "font-semibold",
            metrics.networkHealthScore >= 75 ? "text-emerald-400" :
            metrics.networkHealthScore >= 50 ? "text-amber-400" : "text-red-400"
          )}>
            {metrics.networkHealthScore}/100
          </span>
        </div>

        {/* Weather */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {weatherIcons[simulation.weather.condition]}
          <span className="capitalize">{simulation.weather.condition.replace('-', ' ')}</span>
        </div>

        {/* AI Status */}
        <div className="flex items-center gap-1.5 text-xs">
          <Cpu className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-violet-400 font-medium">AI Active</span>
        </div>
      </div>

      {/* Right: Alerts & Theme */}
      <div className="flex items-center gap-3">
        {/* Alerts */}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-all">
          <Bell className="w-4 h-4" />
          {pendingAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {pendingAlerts > 9 ? '9+' : pendingAlerts}
            </span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-all"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Active Events Count */}
        {simulation.activeEvents.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
            <span className="text-xs font-semibold text-amber-400">
              {simulation.activeEvents.length} Event{simulation.activeEvents.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
