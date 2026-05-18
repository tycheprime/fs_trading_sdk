import {
  createEmptySession,
  loadMarketSession,
  saveMarketSession,
  type MarketAgentSession,
} from './marketSession';
import {
  fetchRemoteSession,
  isRemoteSessionEnabled,
  pushRemoteSession,
} from './remoteSession';

/** Pull shared cache into localStorage when remote is newer or local is empty. */
export async function hydrateMarketSession(
  marketId: string | number,
): Promise<MarketAgentSession | null> {
  if (!isRemoteSessionEnabled()) {
    return loadMarketSession(marketId);
  }

  const local = loadMarketSession(marketId);
  const remote = await fetchRemoteSession(marketId);

  if (!remote) {
    return local;
  }

  const remoteScore =
    (remote.lastEstimate ? 2 : 0) + Math.min(remote.sources.length, 10_000);
  const localScore =
    (local?.lastEstimate ? 2 : 0) + Math.min(local?.sources.length ?? 0, 10_000);

  if (!local || remoteScore > localScore) {
    saveMarketSession(remote);
    return remote;
  }

  return local;
}

/** Save locally and push to shared cache (fire-and-forget). */
export function persistMarketSession(session: MarketAgentSession): void {
  saveMarketSession(session);
  void pushRemoteSession(session);
}

export function getOrCreateSession(marketId: string | number): MarketAgentSession {
  return loadMarketSession(marketId) ?? createEmptySession(marketId);
}
