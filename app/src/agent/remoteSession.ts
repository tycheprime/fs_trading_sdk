import type { MarketAgentSession } from './marketSession';

function cacheBase(): string {
  const raw = import.meta.env.VITE_AGENT_CACHE_URL?.replace(/\/$/, '') ?? '';
  if (!raw) return '';
  if (!/^https?:\/\//i.test(raw)) return `https://${raw}`;
  return raw;
}

export function isRemoteSessionEnabled(): boolean {
  return cacheBase().length > 0;
}

export async function fetchRemoteSession(
  marketId: string | number,
): Promise<MarketAgentSession | null> {
  const base = cacheBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/sessions/${encodeURIComponent(String(marketId))}`);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as {
      session?: MarketAgentSession;
      updatedAt?: number;
    };
    return data.session ?? null;
  } catch {
    return null;
  }
}

export async function pushRemoteSession(session: MarketAgentSession): Promise<void> {
  const base = cacheBase();
  if (!base) return;
  try {
    await fetch(`${base}/sessions/${encodeURIComponent(session.marketId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session }),
    });
  } catch {
    // Best-effort sync; localStorage remains source of truth offline.
  }
}

export interface SessionSummary {
  marketId: string;
  changedMind: boolean;
  updatedAt: number;
  pointEstimate: number | null;
  distributionType: string | null;
}

export async function fetchSessionSummaries(): Promise<SessionSummary[]> {
  const base = cacheBase();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/sessions`);
    if (!res.ok) return [];
    const data = (await res.json()) as { summaries?: SessionSummary[] };
    return data.summaries ?? [];
  } catch {
    return [];
  }
}
