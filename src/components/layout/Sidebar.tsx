'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Map, TrendingUp, Truck, GitBranch, Box,
  AlertTriangle, Route, Heart, Users, MessageSquare,
  FileText, Database, Settings, Zap
} from 'lucide-react';
import { NAV_ITEMS, APP_NAME, DISCLAIMER } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/stores/app-store';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Map, TrendingUp, Truck, GitBranch, Box,
  AlertTriangle, Route, Heart, Users, MessageSquare,
  FileText, Database, Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { simulation } = useAppStore();

  return (
    <aside className="w-64 bg-gray-900/80 backdrop-blur-xl border-r border-gray-800/50 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              {APP_NAME}
            </h1>
            <p className="text-[10px] text-gray-500 leading-tight">Transport Intelligence</p>
          </div>
        </div>
      </div>

      {/* Crisis Mode Indicator */}
      {simulation.isCrisisMode && (
        <div className="mx-3 mt-3 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-400">CRISIS MODE ACTIVE</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard;
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-blue-500/15 text-blue-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-blue-400' : 'text-gray-500')} />
              <span>{item.label}</span>
              {item.id === 'crisis' && simulation.isCrisisMode && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Disclaimer */}
      <div className="p-4 border-t border-gray-800/50">
        <p className="text-[9px] text-gray-600 text-center leading-relaxed">
          {DISCLAIMER}
        </p>
      </div>
    </aside>
  );
}
