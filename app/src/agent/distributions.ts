import {
  generateBelief,
  generateDip,
  generateGaussian,
  generateLeftSkew,
  generateRange,
  generateRightSkew,
} from '@functionspace/core';
import type { MarketConfig } from '@functionspace/core';
import type { AgentDistributionType, AgentEstimate, BeliefBuild } from './types';

export const AGENT_DISTRIBUTION_TYPES: AgentDistributionType[] = [
  'gaussian',
  'spike',
  'range',
  'bimodal',
  'leftskew',
  'rightskew',
  'dip',
  'uniform',
];

export const DISTRIBUTION_LABELS: Record<AgentDistributionType, string> = {
  gaussian: 'Gaussian',
  spike: 'Spike',
  range: 'Range',
  bimodal: 'Bimodal',
  leftskew: 'Left skew',
  rightskew: 'Right skew',
  dip: 'Dip',
  uniform: 'Uniform',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function sigmaFromInterval(low: number, high: number, bucketWidth: number, span: number): number {
  const raw = Math.abs(high - low) / 3.29;
  return clamp(raw, bucketWidth, span / 2);
}

export function estimateToBelief(
  estimate: AgentEstimate,
  config: MarketConfig,
): BeliefBuild {
  const { numBuckets, lowerBound, upperBound } = config;
  const span = upperBound - lowerBound;
  const bucketWidth = span / numBuckets;

  const center = clamp(
    estimate.pointEstimate,
    lowerBound + bucketWidth,
    upperBound - bucketWidth,
  );
  let low = clamp(estimate.low, lowerBound, upperBound);
  let high = clamp(estimate.high, lowerBound, upperBound);
  if (low > high) [low, high] = [high, low];
  if (low === high) {
    low = Math.max(lowerBound, low - bucketWidth);
    high = Math.min(upperBound, high + bucketWidth);
  }

  const spread = sigmaFromInterval(low, high, bucketWidth, span);
  const { distributionType } = estimate;

  let belief: number[];

  switch (distributionType) {
    case 'spike': {
      const spikeSpread = clamp(spread * 0.12, bucketWidth, span * 0.05);
      belief = generateGaussian(center, spikeSpread, numBuckets, lowerBound, upperBound);
      break;
    }
    case 'range':
      belief = generateRange(low, high, numBuckets, lowerBound, upperBound, 0.65);
      break;
    case 'bimodal': {
      const peakA = center;
      const peakB = clamp(
        estimate.secondaryPeak ?? high,
        lowerBound + bucketWidth,
        upperBound - bucketWidth,
      );
      const weightOnB = clamp(estimate.peakWeight ?? 0.5, 0.15, 0.85);
      belief = generateBelief(
        [
          {
            type: 'point',
            center: peakA,
            spread: spread * 0.85,
            weight: 1 - weightOnB,
          },
          {
            type: 'point',
            center: peakB,
            spread: spread * 0.85,
            weight: weightOnB,
          },
        ],
        numBuckets,
        lowerBound,
        upperBound,
      );
      break;
    }
    case 'dip':
      belief = generateDip(center, spread, numBuckets, lowerBound, upperBound);
      break;
    case 'leftskew':
      belief = generateLeftSkew(
        center,
        spread,
        numBuckets,
        lowerBound,
        upperBound,
        0.65,
      );
      break;
    case 'rightskew':
      belief = generateRightSkew(
        center,
        spread,
        numBuckets,
        lowerBound,
        upperBound,
        0.65,
      );
      break;
    case 'uniform':
      belief = generateRange(
        lowerBound,
        upperBound,
        numBuckets,
        lowerBound,
        upperBound,
        0.35,
      );
      break;
    case 'gaussian':
    default:
      belief = generateGaussian(center, spread, numBuckets, lowerBound, upperBound);
      break;
  }

  return {
    belief,
    distributionType,
    center,
    spread,
    label: DISTRIBUTION_LABELS[distributionType],
  };
}
