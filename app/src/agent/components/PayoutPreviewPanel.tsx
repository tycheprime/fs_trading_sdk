import { useContext, useEffect, useRef, useState } from 'react';
import { FunctionSpaceContext, usePreviewPayout } from '@functionspace/react';
import type { PayoutCurve } from '@functionspace/core';
import { Panel } from './Panel';
import { MONO } from '../theme';
import { formatOutcome, formatUsdShort } from '../format';
import type { BeliefBuild } from '../types';

const DEFAULT_COLLATERAL = 100;

interface PayoutPreviewPanelProps {
  marketId: string | number;
  beliefBuild: BeliefBuild | null;
  units: string;
}

export function PayoutPreviewPanel({
  marketId,
  beliefBuild,
  units,
}: PayoutPreviewPanelProps) {
  const ctx = useContext(FunctionSpaceContext);
  const { execute: previewPayout, loading, error } = usePreviewPayout(marketId);
  const [collateral, setCollateral] = useState(DEFAULT_COLLATERAL);
  const [curve, setCurve] = useState<PayoutCurve | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      ctx?.setPreviewPayout(null);
    };
  }, [ctx]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!beliefBuild || !ctx || collateral <= 0) {
      setCurve(null);
      ctx?.setPreviewPayout(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await previewPayout(beliefBuild.belief, collateral);
        if (!mountedRef.current) return;
        setCurve(result);
        ctx.setPreviewPayout(result);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!mountedRef.current) return;
        setCurve(null);
        ctx.setPreviewPayout(null);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [beliefBuild, collateral, marketId, previewPayout, ctx]);

  return (
    <Panel title="Payout preview">
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 12,
          lineHeight: 1.45,
          color: 'var(--fs-text-secondary)',
        }}
      >
        Hypothetical payout if you traded this agent curve. No commitment or
        wallet required.
      </p>

      {!beliefBuild ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--fs-text-secondary)' }}>
          Waiting for an agent forecast to preview payout.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>Collateral</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  color: 'var(--fs-text-secondary)',
                }}
              >
                USD
              </span>
              <input
                type="number"
                min={1}
                step={10}
                value={collateral}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n > 0) setCollateral(n);
                }}
                style={{
                  width: 88,
                  fontFamily: MONO,
                  fontSize: 13,
                  padding: '6px 8px',
                  borderRadius: 5,
                  border: '1px solid var(--fs-border)',
                  background: 'var(--fs-input-bg, #0b0e13)',
                  color: 'var(--fs-text)',
                }}
              />
            </div>
          </div>

          {loading && !curve && (
            <div
              style={{
                fontFamily: MONO,
                fontSize: 12,
                color: 'var(--fs-text-secondary)',
              }}
            >
              Computing payout curve…
            </div>
          )}

          {error && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--fs-negative)',
                border: '1px solid var(--fs-negative)',
                borderRadius: 6,
                padding: '8px 10px',
              }}
            >
              {error.message}
            </div>
          )}

          {curve && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--fs-text-secondary)',
                  }}
                >
                  Max payout
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 26,
                    fontWeight: 700,
                    color: 'var(--fs-positive)',
                    lineHeight: 1.1,
                  }}
                >
                  {formatUsdShort(curve.maxPayout)}
                </div>
              </div>
              <StatRow
                label="Best outcome"
                value={formatOutcome(curve.maxPayoutOutcome, units)}
              />
              <StatRow
                label="Stake"
                value={formatUsdShort(curve.inputCollateral)}
              />
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 11,
                  color: 'var(--fs-text-secondary)',
                  fontFamily: MONO,
                }}
              >
                Hover the chart for payout at nearby outcomes.
              </p>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: MONO,
        fontSize: 12,
      }}
    >
      <span style={{ color: 'var(--fs-text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
