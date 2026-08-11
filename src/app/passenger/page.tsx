'use client';

import { AppShell } from '@/components/layout/AppShell';
import React, { useState } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { cn, formatTime } from '@/lib/utils';
import { MapPin, Search, Bus, Clock, User, Bell, ChevronRight, Navigation } from 'lucide-react';

export default function PassengerPage() {
  const { buses, routes, simulation, stops } = useAppStore();
  const [activeTab, setActiveTab] = useState<'journey' | 'live'>('journey');
  const [searchQuery, setSearchQuery] = useState('');

  // Get active buses
  const activeBuses = buses.filter(b => b.status === 'in-service' || b.status === 'at-stop');

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-120px)] items-center justify-center gap-12">
        {/* Context panel */}
        <div className="max-w-md space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Passenger Experience</h1>
            <p className="text-gray-400">
              The TRANSOPT platform doesn't just help operators — it directly improves the passenger experience through a connected mobile app.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Navigation className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Smart Journey Planning</h3>
                <p className="text-sm text-gray-500">AI suggests routes based not just on time, but also predicted crowding and seat availability.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Bus className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Live Occupancy</h3>
                <p className="text-sm text-gray-500">Passengers can see exactly how full an arriving bus is before it reaches the stop.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Proactive Alerts</h3>
                <p className="text-sm text-gray-500">During crises, the AI automatically sends alternative route suggestions to affected passengers.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile App Mockup */}
        <div className="w-[380px] h-[740px] bg-gray-950 border-[6px] border-gray-800 rounded-[3rem] overflow-hidden shadow-2xl relative flex flex-col">
          {/* Status bar mock */}
          <div className="h-7 w-full flex items-center justify-between px-6 pt-1 text-[11px] font-medium text-white z-10 bg-gray-950/80 backdrop-blur-sm absolute top-0">
            <span>{formatTime(simulation.currentTime)}</span>
            <div className="flex gap-1.5 items-center">
              <div className="w-4 h-3 bg-white/20 rounded-sm" />
              <div className="w-4 h-3 bg-white/20 rounded-sm" />
              <div className="w-5 h-2.5 bg-white rounded-sm" />
            </div>
          </div>

          {/* Dynamic Island mock */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />

          {/* App Header */}
          <div className="pt-14 pb-4 px-5 bg-gradient-to-b from-blue-900/40 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400">Good morning, passenger</p>
                <h2 className="text-xl font-bold text-white">Where to today?</h2>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search destination or route..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-gray-800/80 border border-gray-700/50 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-5 mb-4 border-b border-gray-800/50">
            <button
              onClick={() => setActiveTab('journey')}
              className={cn(
                'flex-1 pb-3 text-sm font-medium transition-all relative',
                activeTab === 'journey' ? 'text-white' : 'text-gray-500'
              )}
            >
              Journey Planner
              {activeTab === 'journey' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={cn(
                'flex-1 pb-3 text-sm font-medium transition-all relative',
                activeTab === 'live' ? 'text-white' : 'text-gray-500'
              )}
            >
              Live Network
              {activeTab === 'live' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-20 no-scrollbar">
            {activeTab === 'journey' ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-400">AI Suggested Routes</h3>
                
                {/* Route Option 1 - Fastest */}
                <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800/80 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold">FASTEST</span>
                        <span className="text-lg font-bold text-white">28 min</span>
                      </div>
                      <p className="text-xs text-gray-400">Arrives at {formatTime(simulation.currentTime + 28)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">₹24</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-4 text-sm text-gray-300">
                    <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">R1</span>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                    <span className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center font-bold">R4</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between text-[11px]">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <User className="w-3 h-3" /> Low crowding (30%)
                    </span>
                    <span className="text-blue-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Highly reliable
                    </span>
                  </div>
                </div>

                {/* Route Option 2 - No Transfer */}
                <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800/80 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">NO TRANSFER</span>
                        <span className="text-lg font-bold text-white">35 min</span>
                      </div>
                      <p className="text-xs text-gray-400">Arrives at {formatTime(simulation.currentTime + 35)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">₹18</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-4 text-sm text-gray-300">
                    <span className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold">R7</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between text-[11px]">
                    <span className="text-amber-400 flex items-center gap-1">
                      <User className="w-3 h-3" /> High crowding (85%)
                    </span>
                    <span className="text-red-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Traffic delays expected
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-400">Live Buses Near You</h3>
                {activeBuses.slice(0, 5).map(bus => {
                  const route = routes.find(r => r.id === bus.assignedRouteId);
                  const occ = (bus.currentPassengers / bus.capacity) * 100;
                  const isDelayed = bus.delayMinutes > 3;

                  return (
                    <div key={bus.id} className="p-4 rounded-2xl bg-gray-900 border border-gray-800/80">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                            <Bus className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold">{route?.shortName || 'Bus'}</h4>
                            <p className="text-xs text-gray-400">Towards {route?.name.split(' - ')[1] || 'Destination'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn('text-sm font-bold', isDelayed ? 'text-red-400' : 'text-emerald-400')}>
                            {isDelayed ? `${Math.round(bus.delayMinutes)} min late` : 'On time'}
                          </div>
                          <p className="text-xs text-gray-500">2 stops away</p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-400">Occupancy</span>
                          <span className={cn(
                            occ > 85 ? 'text-red-400' : occ > 60 ? 'text-amber-400' : 'text-emerald-400'
                          )}>{Math.round(occ)}% full</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              'h-full rounded-full transition-all',
                              occ > 85 ? 'bg-red-500' : occ > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min(100, occ)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {occ < 50 ? 'Seats likely available' : occ < 85 ? 'Standing room only' : 'Very crowded, might not stop'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Nav */}
          <div className="absolute bottom-0 w-full h-16 bg-gray-950 border-t border-gray-800/50 flex justify-around items-center px-4 z-10 pb-2">
            <button className="flex flex-col items-center gap-1 text-blue-500">
              <Search className="w-5 h-5" />
              <span className="text-[9px]">Plan</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
              <MapPin className="w-5 h-5" />
              <span className="text-[9px]">Stops</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="text-[9px]">Alerts</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
              <User className="w-5 h-5" />
              <span className="text-[9px]">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
