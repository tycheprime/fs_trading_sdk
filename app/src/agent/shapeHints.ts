import type { AgentDistributionType } from './types';

export const SHAPE_HINTS: Record<AgentDistributionType, string> = {
  gaussian:
    'A single peaked view: one most likely outcome with uncertainty on both sides.',
  spike:
    'Very high confidence in one level: narrow peak on the chart.',
  range:
    'Outcome likely anywhere in a band: flat mass between low and high.',
  bimodal:
    'Two credible scenarios (e.g. bull vs bear paths) weighted on the chart.',
  leftskew:
    'Skewed lower: more downside tail than upside from the point estimate.',
  rightskew:
    'Skewed higher: more upside tail than downside from the point estimate.',
  dip:
    'Low probability near the center: outcome more likely away from the midpoint.',
  uniform:
    'Little information: spread doubt across the whole outcome range.',
};
