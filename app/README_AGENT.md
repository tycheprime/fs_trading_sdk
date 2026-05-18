# Tycheprime Agent

A multi-market forecaster on the [functionSPACE](https://ecosystem.functionspace.dev/learn/) protocol: beliefs are **probability curves** over a numeric range, not yes/no contracts.

## Routes

| Path | Purpose |
|------|---------|
| `/` | All **open** markets (terminal grid) |
| `/market/:marketId` | Agent for one market (chart, exa poll, Claude, cycle log) |

## Per-market agent

1. **exa search** every 20s (configurable) while auto-cycle is on.
2. **Dedupe** by URL — if nothing new, skip Claude and keep the current curve.
3. **Claude** maintains a **conversation per market** in `localStorage`, optionally synced to a shared cache.
4. **Structured belief** — Claude picks a `distribution_type` and parameters; the SDK builds the curve via `generateGaussian`, `generateRange`, `generateBelief`, etc.

Supported shapes: `gaussian`, `spike`, `range`, `bimodal`, `leftskew`, `rightskew`, `dip`, `uniform`.

## Shared cache (optional)

A small Node API (`app/server/index.mjs`) stores each market's session (sources, Claude messages, last forecast) in **Postgres** on Render or in JSON files locally.

- **Local:** `npm run server -w app` (port 8787, file storage under `app/server/.data/`)
- **Production:** `render.yaml` defines `tycheprime-agent-cache` + free Postgres `tycheprime-agent-db`
- **Frontend:** set `VITE_AGENT_CACHE_URL` (baked in at static build time on Render)

New visitors hydrate from the cache before the first Exa poll, so they see prior forecasts without re-running Claude from scratch. After any cycle, the agent pushes updates to the cache.

## Setup

```bash
# app/.env.local
EXA_API_KEY=...
ANTHROPIC_API_KEY=...
VITE_FS_BASE_URL=...
VITE_AGENT_CACHE_URL=http://localhost:8787   # optional
```

```bash
# Terminal 1 — cache API
npm run server -w app

# Terminal 2 — UI
cd app && npm run dev
```

Open http://localhost:3000

## Deploy notes (Render)

1. Apply the blueprint or create **Web Service** `tycheprime-agent-cache` with `node server/index.mjs` from `app/`, plus free Postgres and `DATABASE_URL`.
2. On the static site `tycheprime-agent`, set `VITE_AGENT_CACHE_URL` to the cache service URL (e.g. `https://tycheprime-agent-cache.onrender.com`) and redeploy so the bundle includes it.
3. Set `ALLOWED_ORIGINS` on the cache service to include your static site URL.

Exa and Claude still need server-side proxies for production (static sites cannot hold API keys). Local dev uses Vite proxies in `vite.config.ts`.
