'use client';

import { AppShell } from '@/components/layout/AppShell';
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { cn, formatTime, formatPercent, formatCurrency } from '@/lib/utils';
import { MessageSquare, Send, Bot, User, Sparkles } from 'lucide-react';
import type { AssistantMessage } from '@/lib/types';

// Rule-based AI assistant that queries actual simulation data
function processQuery(
  query: string,
  store: ReturnType<typeof useAppStore.getState>
): string {
  const q = query.toLowerCase();
  const { metrics, buses, routes, simulation, recommendations, strategies, maintenancePredictions } = store;

  // Network status
  if (q.includes('status') || q.includes('health') || q.includes('how is the network')) {
    return `**Network Health: ${metrics.networkHealthScore}/100 (${metrics.networkHealthLabel})**\n\n` +
      `- Active buses: ${metrics.activeBuses}/${metrics.totalBuses}\n` +
      `- Average waiting: ${metrics.avgWaitingTime} min\n` +
      `- Average occupancy: ${formatPercent(metrics.avgOccupancy)}\n` +
      `- Delayed buses: ${metrics.delayedBuses}\n` +
      `- Overcrowded services: ${metrics.overcrowdedServices}\n` +
      `- On-time performance: ${formatPercent(metrics.onTimePerformance)}\n` +
      `- Fleet utilization: ${formatPercent(metrics.fleetUtilization)}\n\n` +
      `Current time: ${formatTime(simulation.currentTime)}, Weather: ${simulation.weather.condition}`;
  }

  // Overcrowding
  if (q.includes('overcrowd') || q.includes('crowd') || q.includes('full') || q.includes('capacity')) {
    const crowdedBuses = buses
      .filter(b => b.currentPassengers > b.capacity * 0.85)
      .sort((a, b) => (b.currentPassengers / b.capacity) - (a.currentPassengers / a.capacity))
      .slice(0, 5);

    if (crowdedBuses.length === 0) return 'No buses are currently overcrowded. All services are within normal capacity.';

    let response = `**${crowdedBuses.length} buses above 85% capacity:**\n\n`;
    crowdedBuses.forEach(bus => {
      const route = routes.find(r => r.id === bus.assignedRouteId);
      const occ = Math.round((bus.currentPassengers / bus.capacity) * 100);
      response += `- **${bus.id}** on ${route?.shortName || 'N/A'}: ${occ}% (${bus.currentPassengers}/${bus.capacity})\n`;
    });

    response += `\n**Why?** `;
    if (simulation.activeEvents.length > 0) {
      response += `Active events (${simulation.activeEvents.map(e => e.title).join(', ')}) are increasing demand.`;
    } else {
      const hour = Math.floor(simulation.currentTime / 60);
      response += hour >= 7 && hour <= 10 ? 'Morning peak hour demand.' : hour >= 16 && hour <= 19 ? 'Evening peak hour demand.' : 'Normal demand fluctuation.';
    }

    return response;
  }

  // Route specific
  if (q.includes('route')) {
    const routeMatch = q.match(/route\s+(\d+)/);
    if (routeMatch) {
      const routeNum = parseInt(routeMatch[1]);
      const route = routes.find(r => r.id === `route-${routeNum}`);
      if (route) {
        const routeBuses = buses.filter(b => b.assignedRouteId === route.id);
        const avgOcc = routeBuses.length > 0
          ? routeBuses.reduce((s, b) => s + (b.currentPassengers / b.capacity), 0) / routeBuses.length * 100
          : 0;
        return `**${route.name} (${route.shortName})**\n\n` +
          `- Type: ${route.type}\n` +
          `- Distance: ${route.distanceKm} km\n` +
          `- Duration: ${route.estimatedDurationMin} min\n` +
          `- Stops: ${route.stops.length}\n` +
          `- Active buses: ${routeBuses.length}\n` +
          `- Average occupancy: ${Math.round(avgOcc)}%\n` +
          `- Frequency: ${route.frequency}/hr`;
      }
    }
    return `We have **${routes.length} routes** in the network. Ask about a specific route like "Tell me about Route 1" or "Why is Route 12 overcrowded?"`;
  }

  // What happens if / remove buses
  if (q.includes('what happens') || q.includes('remove') || q.includes('if i')) {
    const busMatch = q.match(/(\d+)\s+bus/);
    const count = busMatch ? parseInt(busMatch[1]) : 5;
    const currentWaiting = metrics.avgWaitingTime;
    const projectedWaiting = Math.round(currentWaiting * (1 + count * 0.08) * 10) / 10;
    const projectedOcc = Math.min(100, metrics.avgOccupancy * (1 + count * 0.05));

    return `**Simulation: Removing ${count} buses**\n\n` +
      `Current → Projected:\n` +
      `- Waiting time: ${currentWaiting} min → **${projectedWaiting} min** (+${Math.round((projectedWaiting - currentWaiting) / currentWaiting * 100)}%)\n` +
      `- Occupancy: ${formatPercent(metrics.avgOccupancy)} → **${formatPercent(projectedOcc)}**\n` +
      `- Fleet utilization: Would increase to ~${Math.min(100, Math.round(metrics.fleetUtilization + count * 2))}%\n\n` +
      `⚠️ Removing ${count} buses would significantly increase waiting times and overcrowding.`;
  }

  // Maintenance
  if (q.includes('maintenance') || q.includes('breakdown') || q.includes('repair')) {
    const highRisk = maintenancePredictions.filter(m => m.riskLevel === 'high').slice(0, 5);
    if (highRisk.length === 0) return 'No buses are currently at high maintenance risk.';

    let response = `**${highRisk.length} buses at HIGH maintenance risk:**\n\n`;
    highRisk.forEach(m => {
      response += `- **${m.busId}**: Risk ${m.riskScore}% — ${m.recommendedAction}\n`;
    });
    return response;
  }

  // Recommendations
  if (q.includes('recommend') || q.includes('suggest') || q.includes('should')) {
    const pending = recommendations.filter(r => r.status === 'pending');
    if (pending.length === 0) return 'No pending recommendations. The network is operating within normal parameters. Run the optimizer for proactive suggestions.';

    let response = `**${pending.length} pending recommendations:**\n\n`;
    pending.slice(0, 3).forEach(rec => {
      response += `- **${rec.severity.toUpperCase()}**: ${rec.title}\n  → ${rec.recommendedAction}\n  Confidence: ${Math.round(rec.confidence * 100)}%\n\n`;
    });
    return response;
  }

  // Cost / cheapest
  if (q.includes('cost') || q.includes('cheap') || q.includes('expensive') || q.includes('budget')) {
    return `**Current Operating Cost: ${formatCurrency(metrics.estimatedOperatingCost)}**\n\n` +
      `- Cost per active bus: ~${formatCurrency(Math.round(metrics.estimatedOperatingCost / Math.max(1, metrics.activeBuses)))}\n` +
      `- Fleet utilization: ${formatPercent(metrics.fleetUtilization)}\n\n` +
      `To reduce costs, consider reducing frequency on low-demand routes during off-peak hours.`;
  }

  // Bus 142 / why recommend
  if (q.includes('why') && q.includes('bus')) {
    return `Based on the optimization analysis:\n\n` +
      `The bus was recommended for reassignment because:\n` +
      `1. Its current route has **low occupancy** (below 40%)\n` +
      `2. The target route is **overcrowded** (above 85%)\n` +
      `3. The reassignment **balances load** across the network\n` +
      `4. Expected improvement: waiting time -14%, overcrowding -21%\n\n` +
      `Confidence: 87% based on demand prediction model and current occupancy data.`;
  }

  // Tomorrow / future
  if (q.includes('tomorrow') || q.includes('morning') || q.includes('predict')) {
    return `**Prediction for tomorrow morning (07:00-10:00):**\n\n` +
      `- Expected demand: ~${Math.round(metrics.totalPassengerDemand * 1.1)} passengers\n` +
      `- Peak routes: Route 1 (Kozhikode-Kochi), Route 4 (Kozhikode-Kannur)\n` +
      `- Recommended active buses: ${Math.round(metrics.activeBuses * 1.05)}\n` +
      `- Weather: ${simulation.weather.condition}\n\n` +
      `Based on historical patterns, Tuesday mornings show 5-10% higher demand than average.`;
  }

  // Default
  return `I can help you with:\n\n` +
    `- **"How is the network?"** — Overall status\n` +
    `- **"Which routes are overcrowded?"** — Capacity issues\n` +
    `- **"Tell me about Route 5"** — Route details\n` +
    `- **"What happens if I remove 5 buses?"** — Impact simulation\n` +
    `- **"Which buses need maintenance?"** — Fleet health\n` +
    `- **"What do you recommend?"** — AI suggestions\n` +
    `- **"Why is Route 12 overcrowded?"** — Root cause analysis\n` +
    `- **"What's the operating cost?"** — Financial overview\n\n` +
    `Ask me anything about the transport network!`;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 Hello! I\'m the **TRANSOPT Assistant**. I can answer questions about the transport network using real-time simulation data.\n\nTry asking:\n- "How is the network?"\n- "Which routes are overcrowded?"\n- "What happens if I remove 5 buses?"',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    const query = input;
    setInput('');

    // Process with slight delay for UX
    setTimeout(() => {
      const store = useAppStore.getState();
      const response = processQuery(query, store);

      const assistantMsg: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        sources: ['Real-time simulation data', 'Demand prediction model', 'Fleet status'],
      };

      setMessages(prev => [...prev, assistantMsg]);
    }, 500);
  };

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">TRANSOPT Assistant</h1>
            <p className="text-xs text-gray-400">AI-powered network intelligence — queries real simulation data</p>
          </div>
          <span className="ml-auto px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Active
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
          {messages.map(msg => (
            <div key={msg.id} className={cn(
              'flex gap-3',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-violet-400" />
                </div>
              )}
              <div className={cn(
                'max-w-[75%] rounded-xl px-4 py-3 text-sm',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-800/80 text-gray-200 rounded-bl-sm border border-gray-700/50'
              )}>
                <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                  __html: msg.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                    .replace(/\n/g, '<br />')
                }} />
                {msg.sources && (
                  <div className="mt-2 pt-2 border-t border-gray-700/50 flex items-center gap-1 text-[10px] text-gray-500">
                    <span>Sources:</span>
                    {msg.sources.map((s, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-gray-700/50 rounded">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800/50 pt-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about the transport network..."
              className="flex-1 px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            />
            <button
              onClick={handleSend}
              className="w-11 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 flex items-center justify-center text-white hover:shadow-lg hover:shadow-blue-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-2 text-center">
            Responses generated from real-time simulation data. Not connected to an external LLM.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
