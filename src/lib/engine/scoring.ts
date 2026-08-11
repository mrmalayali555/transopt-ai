// =============================================================================
// TRANSOPT AI — Scoring / Objective Function
// Evaluates network state quality for optimization
// =============================================================================

import type { NetworkMetrics } from '@/lib/types';
import { DEFAULT_WEIGHTS, CRISIS_WEIGHTS } from '@/lib/constants';

export interface ScoringWeights {
  waitingTime: number;
  overcrowding: number;
  missedConnections: number;
  operatingCost: number;
  delay: number;
  passengerSafety?: number;
  accessibility?: number;
  emergencyConnectivity?: number;
}

/**
 * Calculate the network health score (0-100).
 * Higher is better.
 */
export function calculateNetworkScore(
  metrics: NetworkMetrics,
  isCrisisMode = false
): number {
  const weights: ScoringWeights = isCrisisMode ? CRISIS_WEIGHTS : DEFAULT_WEIGHTS;

  // Normalize each metric to 0-1 (where 1 = best)
  const waitingScore = Math.max(0, 1 - metrics.avgWaitingTime / 30); // 30 min = worst
  const occupancyScore = metrics.avgOccupancy <= 85
    ? 1 - Math.max(0, metrics.avgOccupancy - 50) / 35 // 50-85% is ok range
    : Math.max(0, 1 - (metrics.avgOccupancy - 85) / 15); // >85% rapidly drops
  const connectionScore = Math.max(0, 1 - metrics.missedConnections / 50);
  const costScore = 0.7; // Normalized cost (no absolute baseline in demo)
  const delayScore = Math.max(0, 1 - metrics.delayedBuses / Math.max(1, metrics.activeBuses));
  const utilizationBonus = metrics.fleetUtilization / 100;

  let score: number;

  if (isCrisisMode) {
    // In crisis mode, safety-related metrics are weighted more
    score = (
      weights.waitingTime * waitingScore +
      weights.overcrowding * occupancyScore +
      weights.missedConnections * connectionScore +
      weights.operatingCost * costScore +
      weights.delay * delayScore +
      (weights.passengerSafety || 0) * (1 - metrics.overcrowdedServices / Math.max(1, metrics.activeBuses)) +
      (weights.accessibility || 0) * utilizationBonus +
      (weights.emergencyConnectivity || 0) * metrics.onTimePerformance / 100
    );
  } else {
    score = (
      weights.waitingTime * waitingScore +
      weights.overcrowding * occupancyScore +
      weights.missedConnections * connectionScore +
      weights.operatingCost * costScore +
      weights.delay * delayScore
    );
  }

  return Math.round(Math.max(0, Math.min(100, score * 100)));
}

/**
 * Get a label for the health score.
 */
export function getHealthLabel(score: number): string {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 75) return 'GOOD';
  if (score >= 60) return 'MODERATE';
  if (score >= 40) return 'POOR';
  return 'CRITICAL';
}

/**
 * Calculate the optimization objective (to minimize).
 * Lower is better. This is used to compare strategies.
 */
export function calculateObjective(
  avgWaiting: number,
  avgOccupancy: number,
  missedConnections: number,
  operatingCost: number,
  avgDelay: number,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  // Penalties (higher = worse)
  const waitingPenalty = avgWaiting * 10; // 10 points per minute
  const overcrowdingPenalty = avgOccupancy > 85
    ? (avgOccupancy - 85) * 5
    : 0;
  const connectionPenalty = missedConnections * 15; // 15 points per missed connection
  const costPenalty = operatingCost / 1000; // Normalized cost
  const delayPenalty = avgDelay * 8; // 8 points per minute of delay

  return (
    weights.waitingTime * waitingPenalty +
    weights.overcrowding * overcrowdingPenalty +
    weights.missedConnections * connectionPenalty +
    weights.operatingCost * costPenalty +
    weights.delay * delayPenalty
  );
}

/**
 * Score a strategy relative to baseline.
 * Returns 0-100 where higher is better.
 */
export function scoreStrategy(
  baselineObjective: number,
  strategyObjective: number
): number {
  if (baselineObjective === 0) return 50;
  const improvement = (baselineObjective - strategyObjective) / baselineObjective;
  // Map improvement to 0-100 scale
  return Math.round(Math.max(0, Math.min(100, 50 + improvement * 100)));
}
