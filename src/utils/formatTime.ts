/**
 * Converts time_ms (milliseconds) to display string mm:ss.mmm or ss.mmm
 * Convention per CLAUDE.md: all competition times stored as time_ms (milliseconds)
 */
export function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
  }
  return seconds.toFixed(3);
}

/** Converts seconds to display string (for tables that store time in seconds) */
export function formatSeconds(secs: number | null): string {
  if (secs == null || !Number.isFinite(secs) || secs < 0) return '—';
  const minutes = Math.floor(secs / 60);
  const s = secs % 60;
  if (minutes > 0) return `${minutes}:${s.toFixed(3).padStart(6, '0')}`;
  return s.toFixed(3);
}

/** Delta between two times in ms: positive means improved (lower time = better) */
export function timeDeltaMs(current: number, previous: number): number {
  return previous - current;
}

/** Formats delta as "+1.234" or "-0.456" seconds */
export function formatTimeDelta(deltaSec: number): string {
  const sign = deltaSec > 0 ? '+' : '';
  return `${sign}${deltaSec.toFixed(3)}s`;
}
