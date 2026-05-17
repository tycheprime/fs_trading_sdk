import type Anthropic from '@anthropic-ai/sdk';
import type { AgentDistributionType, AgentEstimate, ExaResult } from './types';

const STORAGE_PREFIX = 'fs-agent-session-';

export interface MarketAgentSession {
  marketId: string;
  sources: ExaResult[];
  messages: Anthropic.MessageParam[];
  lastEstimate: AgentEstimate | null;
}

function storageKey(marketId: string | number): string {
  return `${STORAGE_PREFIX}${marketId}`;
}

function normalizeEstimate(estimate: AgentEstimate): AgentEstimate {
  if (estimate.distributionType) return estimate;
  return { ...estimate, distributionType: 'gaussian' as AgentDistributionType };
}

export function loadMarketSession(marketId: string | number): MarketAgentSession | null {
  try {
    const raw = localStorage.getItem(storageKey(marketId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MarketAgentSession;
    if (String(parsed.marketId) !== String(marketId)) return null;
    if (parsed.lastEstimate) {
      parsed.lastEstimate = normalizeEstimate(parsed.lastEstimate);
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveMarketSession(session: MarketAgentSession): void {
  localStorage.setItem(storageKey(session.marketId), JSON.stringify(session));
}

export function createEmptySession(marketId: string | number): MarketAgentSession {
  return {
    marketId: String(marketId),
    sources: [],
    messages: [],
    lastEstimate: null,
  };
}

export function mergeSources(
  existing: ExaResult[],
  incoming: ExaResult[],
): { merged: ExaResult[]; added: ExaResult[] } {
  const seen = new Set(existing.map((s) => s.url).filter(Boolean));
  const added: ExaResult[] = [];
  const merged = [...existing];
  for (const item of incoming) {
    if (!item.url || seen.has(item.url)) continue;
    seen.add(item.url);
    added.push(item);
    merged.push(item);
  }
  return { merged, added };
}
