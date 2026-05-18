/**
 * Agent session cache API — persists Tycheprime Agent forecasts so new visitors
 * can load prior results without re-running Exa + Claude.
 *
 * Storage: Postgres when DATABASE_URL is set, else JSON files under .data/
 */
import http from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '.data', 'sessions');
const PORT = Number(process.env.PORT || 8787);
const DATABASE_URL = process.env.DATABASE_URL || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://fs-trading-sdk.onrender.com')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

let pool = null;

async function getPool() {
  if (!DATABASE_URL) return null;
  if (pool) return pool;
  const pg = await import('pg');
  pool = new pg.default.Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : undefined,
  });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agent_sessions (
      market_id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  return pool;
}

async function readSession(marketId) {
  const db = await getPool();
  if (db) {
    const res = await db.query(
      'SELECT payload, updated_at FROM agent_sessions WHERE market_id = $1',
      [String(marketId)],
    );
    if (res.rowCount === 0) return null;
    return {
      session: res.rows[0].payload,
      updatedAt: new Date(res.rows[0].updated_at).getTime(),
    };
  }
  try {
    const raw = await readFile(path.join(DATA_DIR, `${marketId}.json`), 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed.session) return parsed;
    return { session: parsed, updatedAt: parsed.updatedAt ?? Date.now() };
  } catch {
    return null;
  }
}

async function writeSession(marketId, payload) {
  const db = await getPool();
  if (db) {
    await db.query(
      `INSERT INTO agent_sessions (market_id, payload, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (market_id) DO UPDATE SET payload = $2, updated_at = now()`,
      [String(marketId), payload],
    );
    return;
  }
  await mkdir(DATA_DIR, { recursive: true });
  const envelope = { session: payload, updatedAt: Date.now() };
  await writeFile(path.join(DATA_DIR, `${marketId}.json`), JSON.stringify(envelope, null, 0));
}

async function listSummaries() {
  const db = await getPool();
  if (db) {
    const res = await db.query(
      `SELECT market_id,
              (payload->>'lastEstimate')::jsonb AS estimate,
              updated_at
       FROM agent_sessions
       WHERE payload->'lastEstimate' IS NOT NULL`,
    );
    return res.rows.map((row) => ({
      marketId: row.market_id,
      changedMind: row.estimate?.changedMind === true,
      updatedAt: new Date(row.updated_at).getTime(),
      pointEstimate: row.estimate?.pointEstimate ?? null,
      distributionType: row.estimate?.distributionType ?? null,
    }));
  }
  const { readdir } = await import('node:fs/promises');
  let files = [];
  try {
    files = await readdir(DATA_DIR);
  } catch {
    return [];
  }
  const out = [];
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const id = f.replace(/\.json$/, '');
    const row = await readSession(id);
    const session = row?.session;
    if (!session?.lastEstimate) continue;
    out.push({
      marketId: id,
      changedMind: session.lastEstimate.changedMind === true,
      updatedAt: row.updatedAt ?? Date.now(),
      pointEstimate: session.lastEstimate.pointEstimate ?? null,
      distributionType: session.lastEstimate.distributionType ?? null,
    });
  }
  return out;
}

function corsHeaders(origin) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin);
  const h = {
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (allowed) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Vary'] = 'Origin';
  }
  return h;
}

function send(res, status, body, headers = {}) {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  const baseHeaders = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    send(res, 204, '', baseHeaders);
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      send(res, 200, { ok: true, storage: DATABASE_URL ? 'postgres' : 'file' }, baseHeaders);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/sessions') {
      const summaries = await listSummaries();
      send(res, 200, { summaries }, baseHeaders);
      return;
    }

    const sessionMatch = url.pathname.match(/^\/sessions\/([^/]+)$/);
    if (sessionMatch) {
      const marketId = decodeURIComponent(sessionMatch[1]);
      if (req.method === 'GET') {
        const row = await readSession(marketId);
        if (!row) {
          send(res, 404, { error: 'not_found' }, baseHeaders);
          return;
        }
        send(res, 200, row, baseHeaders);
        return;
      }
      if (req.method === 'PUT') {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        if (!body.session || String(body.session.marketId) !== String(marketId)) {
          send(res, 400, { error: 'invalid_session' }, baseHeaders);
          return;
        }
        await writeSession(marketId, body.session);
        send(res, 200, { ok: true }, baseHeaders);
        return;
      }
    }

    send(res, 404, { error: 'not_found' }, baseHeaders);
  } catch (err) {
    console.error(err);
    send(res, 500, { error: err instanceof Error ? err.message : String(err) }, baseHeaders);
  }
});

server.listen(PORT, () => {
  console.log(`agent cache API on :${PORT} (${DATABASE_URL ? 'postgres' : 'file'})`);
});
