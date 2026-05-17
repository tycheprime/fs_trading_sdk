import { Link } from 'react-router-dom';
import type { MarketState } from '@functionspace/core';
import { StatusPill } from './StatusPill';
import { MONO } from '../theme';
import type { AgentStatus } from '../types';

interface HeaderProps {
  status: AgentStatus;
  market: MarketState | null;
}

export function Header({ status, market }: HeaderProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '12px 20px',
        borderBottom: '1px solid var(--fs-border)',
        background: 'var(--fs-surface)',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: 'var(--fs-primary)',
            color: '#1a1206',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 800,
            flexShrink: 0,
            fontFamily: MONO,
          }}
        >
          FS
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '0.04em',
            }}
          >
            ORACLE <span style={{ color: 'var(--fs-primary)' }}>AGENT</span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--fs-text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 480,
            }}
          >
            {market ? (
              <>
                <Link to="/" className="fs-agent-link" style={{ marginRight: 8 }}>
                  ← Markets
                </Link>
                {market.title}
              </>
            ) : (
              'Loading market…'
            )}
          </div>
        </div>
      </div>

      <StatusPill status={status} />
    </header>
  );
}
