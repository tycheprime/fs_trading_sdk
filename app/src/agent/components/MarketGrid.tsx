import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MarketState } from '@functionspace/core';
import { loadMarketSession } from '../marketSession';
import { fetchSessionSummaries, type SessionSummary } from '../remoteSession';
import { MONO } from '../theme';
import { formatOutcome, formatUsdShort } from '../format';
import { isWatched, loadWatchlist, toggleWatchlist } from '../watchlist';

interface MarketGridProps {
  markets: MarketState[];
  loading: boolean;
}

function consensusLabel(m: MarketState): string {
  const mean =
    typeof m.consensusMean === 'number' && Number.isFinite(m.consensusMean)
      ? m.consensusMean
      : null;
  if (mean == null) return '—';
  return formatOutcome(mean, m.xAxisUnits);
}

export function MarketGrid({ markets, loading }: MarketGridProps) {
  const [watchTick, setWatchTick] = useState(0);
  const [remoteSummaries, setRemoteSummaries] = useState<Map<string, SessionSummary>>(
    () => new Map(),
  );

  useEffect(() => {
    void fetchSessionSummaries().then((list) => {
      setRemoteSummaries(new Map(list.map((s) => [String(s.marketId), s])));
    });
  }, []);

  const sorted = useMemo(() => {
    const pinned = new Set(loadWatchlist());
    return [...markets].sort((a, b) => {
      const ap = pinned.has(a.marketId) ? 0 : 1;
      const bp = pinned.has(b.marketId) ? 0 : 1;
      return ap - bp;
    });
    // watchTick forces re-sort after pin toggle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markets, watchTick]);

  if (loading && markets.length === 0) {
    return (
      <div className="fs-market-grid fs-market-grid-loading" style={{ fontFamily: MONO }}>
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="fs-market-card fs-market-card-skeleton" />
        ))}
      </div>
    );
  }

  if (!loading && markets.length === 0) {
    return (
      <div className="fs-markets-empty" style={{ fontFamily: MONO }}>
        No open markets found.
      </div>
    );
  }

  return (
    <div className="fs-market-grid">
      {sorted.map((m) => {
        const session = loadMarketSession(m.marketId);
        const remote = remoteSummaries.get(String(m.marketId));
        const changed =
          session?.lastEstimate?.changedMind === true ||
          remote?.changedMind === true;
        const hasForecast = !!(session?.lastEstimate ?? remote?.pointEstimate != null);
        const pinned = isWatched(m.marketId);

        return (
          <Link
            key={m.marketId}
            to={`/market/${m.marketId}`}
            className={`fs-market-card${pinned ? ' fs-market-card-pinned' : ''}`}
          >
            <div className="fs-market-card-top">
              <span className="fs-market-card-id" style={{ fontFamily: MONO }}>
                #{m.marketId}
              </span>
              <div className="fs-market-card-top-right">
                {hasForecast && (
                  <span
                    className="fs-market-badge fs-market-badge-cached"
                    style={{ fontFamily: MONO }}
                  >
                    cached
                  </span>
                )}
                {changed && (
                  <span
                    className="fs-market-badge fs-market-badge-changed"
                    style={{ fontFamily: MONO }}
                  >
                    changed
                  </span>
                )}
                <span className="fs-market-card-state" style={{ fontFamily: MONO }}>
                  OPEN
                </span>
                <button
                  type="button"
                  className={`fs-market-pin${pinned ? ' fs-market-pin-on' : ''}`}
                  aria-label={pinned ? 'Unpin market' : 'Pin market'}
                  title={pinned ? 'Unpin' : 'Pin to top'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWatchlist(m.marketId);
                    setWatchTick((t) => t + 1);
                  }}
                >
                  {pinned ? '★' : '☆'}
                </button>
              </div>
            </div>
            <h2 className="fs-market-card-title">{m.title}</h2>
            <div className="fs-market-card-consensus" style={{ fontFamily: MONO }}>
              <span className="fs-market-card-consensus-val">
                {consensusLabel(m)}
              </span>
              <span className="fs-market-card-consensus-lbl">consensus μ</span>
            </div>
            <div className="fs-market-card-stats" style={{ fontFamily: MONO }}>
              <span>vol {formatUsdShort(m.totalVolume)}</span>
              <span>{m.participantCount} traders</span>
              <span>
                {m.config.lowerBound.toLocaleString()}–
                {m.config.upperBound.toLocaleString()} {m.xAxisUnits}
              </span>
            </div>
            <div className="fs-market-card-cta" style={{ fontFamily: MONO }}>
              Open agent →
            </div>
          </Link>
        );
      })}
    </div>
  );
}
