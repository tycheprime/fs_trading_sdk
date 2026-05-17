# Oracle Agent

A multi-market forecaster on the [functionSPACE](https://ecosystem.functionspace.dev/learn/) protocol: beliefs are **probability curves** over a numeric range, not yes/no contracts.

## Routes

| Path | Purpose |
|------|---------|
| `/` | All **open** markets (terminal grid) |
| `/market/:marketId` | Agent for one market (chart, exa poll, Claude, cycle log) |

## Per-market agent

1. **exa search** every 20s (configurable) while auto-cycle is on.
2. **Dedupe** by URL — if nothing new, skip Claude and keep the current curve.
3. **Claude** maintains a **conversation per market** in `localStorage`.
4. **Structured belief** — Claude picks a `distribution_type` and parameters; the SDK builds the curve via `generateGaussian`, `generateRange`, `generateBelief`, etc.

Supported shapes: `gaussian`, `spike`, `range`, `bimodal`, `leftskew`, `rightskew`, `dip`, `uniform`.

## Setup

```bash
# app/.env.local
EXA_API_KEY=...
ANTHROPIC_API_KEY=...
VITE_FS_BASE_URL=...
```

```bash
cd app && npm run dev
```

Open http://localhost:3000
