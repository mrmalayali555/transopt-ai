import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format simulation minutes (0-1440) to HH:MM string */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** Format a number as Indian Rupees */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/** Format percentage */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Get severity color class */
export function getSeverityColor(severity: 'safe' | 'moderate' | 'overcrowded' | 'low' | 'medium' | 'high' | 'critical' | 'info' | 'warning'): string {
  const map: Record<string, string> = {
    safe: 'text-emerald-400',
    low: 'text-emerald-400',
    info: 'text-blue-400',
    moderate: 'text-amber-400',
    medium: 'text-amber-400',
    warning: 'text-amber-400',
    overcrowded: 'text-red-400',
    high: 'text-red-400',
    critical: 'text-red-500',
  };
  return map[severity] || 'text-gray-400';
}

/** Get severity bg color class */
export function getSeverityBg(severity: string): string {
  const map: Record<string, string> = {
    safe: 'bg-emerald-500/20 border-emerald-500/30',
    low: 'bg-emerald-500/20 border-emerald-500/30',
    info: 'bg-blue-500/20 border-blue-500/30',
    moderate: 'bg-amber-500/20 border-amber-500/30',
    medium: 'bg-amber-500/20 border-amber-500/30',
    warning: 'bg-amber-500/20 border-amber-500/30',
    overcrowded: 'bg-red-500/20 border-red-500/30',
    high: 'bg-red-500/20 border-red-500/30',
    critical: 'bg-red-600/20 border-red-600/30',
  };
  return map[severity] || 'bg-gray-500/20 border-gray-500/30';
}

/** Seeded random number generator for reproducible data */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /** Normal distribution (Box-Muller) */
  nextGaussian(mean: number, stdDev: number): number {
    const u1 = this.next();
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
  }
}

/** Interpolate between two coordinates */
export function interpolateCoords(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  t: number
): { lat: number; lng: number } {
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  };
}

/** Calculate distance between two coordinates (Haversine, km) */
export function haversineDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDlat = Math.sin(dLat / 2);
  const sinDlng = Math.sin(dLng / 2);
  const h =
    sinDlat * sinDlat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDlng * sinDlng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Clamp value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Generate a unique ID */
let idCounter = 0;
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}
