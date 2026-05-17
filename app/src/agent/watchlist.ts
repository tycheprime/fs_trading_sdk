const KEY = 'fs-agent-watchlist';

export function loadWatchlist(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => typeof id === 'number');
  } catch {
    return [];
  }
}

export function saveWatchlist(ids: number[]): void {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

export function toggleWatchlist(marketId: number): boolean {
  const ids = loadWatchlist();
  const i = ids.indexOf(marketId);
  if (i >= 0) {
    ids.splice(i, 1);
    saveWatchlist(ids);
    return false;
  }
  ids.push(marketId);
  saveWatchlist(ids);
  return true;
}

export function isWatched(marketId: number): boolean {
  return loadWatchlist().includes(marketId);
}
