'use client';

import { AppShell } from '@/components/layout/AppShell';
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { cn, formatTime, formatPercent, formatCurrency } from '@/lib/utils';
import { MessageSquare, Send, Bot, User, Sparkles } from 'lucide-react';
import type { AssistantMessage } from '@/lib/types';

// Function to serialize relevant network context for the LLM
function getNetworkContext(store: ReturnType<typeof useAppStore.getState>): string {
  const { metrics, buses, routes, simulation, recommendations, maintenancePredictions } = store;
  
  const overcrowdedBuses = buses.filter(b => b.currentPassengers > b.capacity * 0.85).length;
  const delayedBuses = buses.filter(b => b.delayMinutes > 5).length;
  
  return `
Current Time: ${formatTime(simulation.currentTime)}
Weather: ${simulation.weather.condition}
Active Events: ${simulation.activeEvents.map(e => e.title).join(', ') || 'None'}

NETWORK METRICS:
- Health Score: ${metrics.networkHealthScore}/100 (${metrics.networkHealthLabel})
- Active Buses: ${metrics.activeBuses}
- Avg Waiting Time: ${metrics.avgWaitingTime} min
- Avg Occupancy: ${Math.round(metrics.avgOccupancy)}%
- Overcrowded Buses: ${overcrowdedBuses}
- Delayed Buses: ${delayedBuses}
- Estimated Cost: INR ${metrics.estimatedOperatingCost}

AI RECOMMENDATIONS (Pending):
${recommendations.filter(r => r.status === 'pending').map(r => `- ${r.severity.toUpperCase()}: ${r.title} -> ${r.recommendedAction}`).join('\n') || 'None'}

MAINTENANCE (High Risk):
${maintenancePredictions.filter(m => m.riskLevel === 'high').map(m => `- Bus ${m.busId}: Risk ${m.riskScore}%`).join('\n') || 'None'}
  `.trim();
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 Hello! I\'m the **TRANSOPT AI** powered by NVIDIA Nemotron. I have full access to the live simulation data. How can I help you optimize the network today?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const store = useAppStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    const query = input;
    setInput('');
    setIsTyping(true);

    const context = getNetworkContext(store);
    
    // Create an empty assistant message to stream into
    const assistantMsgId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      sources: ['NVIDIA Nemotron', 'Live Simulation Data'],
    }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, context }),
      });

      if (!res.ok) throw new Error('API Error');
      if (!res.body) throw new Error('No body in response');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMsgId 
              ? { ...msg, content: msg.content + chunk } 
              : msg
          ));
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId 
          ? { ...msg, content: 'Sorry, I encountered an error communicating with the NVIDIA LLM API.' } 
          : msg
      ));
    } finally {
      setIsTyping(false);
    }
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
