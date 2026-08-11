'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/stores/app-store';
import { cn } from '@/lib/utils';
import { PlayCircle, ChevronRight, ChevronLeft, X, MonitorPlay, Zap } from 'lucide-react';

const DEMO_STEPS = [
  {
    title: '1. Executive Overview',
    desc: 'Welcome to TRANSOPT AI. This is the main dashboard where operators see a real-time, high-level view of the entire network health, live active alerts, and AI recommendations.',
    route: '/',
    action: (store: any) => store.setSpeed(1),
  },
  {
    title: '2. Live Network Digital Twin',
    desc: 'This is the real-time geographic digital twin. The AI tracks buses dynamically. Watch how the map visualizes bus occupancy (green/yellow/red) and delays in real-time.',
    route: '/network',
    action: (store: any) => store.setSpeed(2),
  },
  {
    title: '3. Demand Intelligence',
    desc: 'Our predictive model forecasts passenger demand hours in advance. It factors in weather, time of day, and special events to predict exactly how many people will be waiting at each stop.',
    route: '/demand',
  },
  {
    title: '4. AI Fleet Optimization',
    desc: 'Instead of static schedules, TRANSOPT dynamically reallocates buses. Click "Run Optimizer" to see how the AI evaluates millions of permutations to find the most cost-effective way to reduce waiting times.',
    route: '/fleet',
  },
  {
    title: '5. Scenario Simulation',
    desc: 'Let\'s see how the system handles disruptions. This is the Digital Twin simulator. We can inject events like a sudden demand surge or heavy rain and watch the ripple effects.',
    route: '/simulation',
  },
  {
    title: '6. Crisis Mode Activation',
    desc: 'During major emergencies (like floods), the system\'s objective function completely changes. We prioritize passenger safety, evacuation routes, and critical connectivity over cost efficiency.',
    route: '/crisis',
  },
  {
    title: '7. Connection Protection',
    desc: 'The AI prevents the frustrating "missed connection". It tracks transferring passengers and automatically holds departing buses for a few minutes if a connecting bus is slightly delayed.',
    route: '/connections',
  },
  {
    title: '8. Predictive Maintenance',
    desc: 'Using telemetry and historical data, the ML model predicts which buses are likely to break down, allowing maintenance to be scheduled before a disruption occurs on the road.',
    route: '/maintenance',
  },
  {
    title: '9. Route Performance',
    desc: 'Every route is scored and diagnosed. The AI identifies underperforming routes and generates natural-language recommendations (e.g., "Reduce frequency during off-peak").',
    route: '/routes',
  },
  {
    title: '10. Passenger Mobile Experience',
    desc: 'Finally, this intelligence is pushed directly to passengers. They get smart routing based on live crowding, can see exactly how full an arriving bus is, and receive proactive alerts.',
    route: '/passenger',
  }
];

export function DemoController() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const store = useAppStore();

  const handleStart = () => {
    setIsActive(true);
    setCurrentStep(0);
    executeStep(0);
  };

  const handleStop = () => {
    setIsActive(false);
  };

  const executeStep = (stepIndex: number) => {
    const step = DEMO_STEPS[stepIndex];
    if (pathname !== step.route) {
      router.push(step.route);
    }
    if (step.action) {
      step.action(store);
    }
  };

  const handleNext = () => {
    if (currentStep < DEMO_STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      executeStep(next);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      executeStep(prev);
    }
  };

  if (!isActive) {
    return (
      <button
        onClick={handleStart}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold shadow-xl shadow-blue-500/20 hover:scale-105 transition-all group"
      >
        <MonitorPlay className="w-5 h-5 group-hover:animate-pulse" />
        <span>Jury Demo Mode</span>
      </button>
    );
  }

  const step = DEMO_STEPS[currentStep];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-700 shadow-2xl overflow-hidden animate-slide-up">
      <div className="h-2 w-full bg-gray-800">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
          style={{ width: `${((currentStep + 1) / DEMO_STEPS.length) * 100}%` }}
        />
      </div>
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold">
            STEP {currentStep + 1} OF {DEMO_STEPS.length}
          </span>
          <button 
            onClick={handleStop}
            className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-400" />
          {step.title}
        </h3>
        
        <p className="text-sm text-gray-300 leading-relaxed mb-5">
          {step.desc}
        </p>

        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          
          {currentStep < DEMO_STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-colors"
            >
              Finish Demo <CheckCircle2 className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple local CheckCircle2 override for the finish button
function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
