/**
 * Converts a human-readable time string to milliseconds.
 * Accepts: "1:23.456" (min:sec.ms), "23.456" (sec.ms), "83.456" (sec.ms > 60)
 * Returns null on invalid input.
 */
export function parseTimeInput(input: string): number | null {
  const str = input.trim();
  if (!str) return null;

  const colonIdx = str.indexOf(':');
  if (colonIdx !== -1) {
    const mins = parseInt(str.slice(0, colonIdx), 10);
    const rest = parseFloat(str.slice(colonIdx + 1));
    if (isNaN(mins) || isNaN(rest) || mins < 0 || rest < 0) return null;
    return Math.round((mins * 60 + rest) * 1000);
  }

  const secs = parseFloat(str);
  if (isNaN(secs) || secs < 0) return null;
  return Math.round(secs * 1000);
}

/**
 * Converts milliseconds to "m:ss.SSS" or "ss.SSS" string.
 * e.g. 83456 → "1:23.456"  |  23456 → "23.456"
 */
export function formatTimeMs(ms: number): string {
  if (ms <= 0) return '0.000';
  const totalSecs = ms / 1000;
  const mins = Math.floor(totalSecs / 60);
  const secs = (totalSecs - mins * 60).toFixed(3);

  if (mins > 0) {
    return `${mins}:${secs.padStart(6, '0')}`;
  }
  return secs;
}

/**
 * Returns a short improvement string.
 * e.g. bestMs=80000, prevMs=82000 → "-2.000s (2.44%)"
 */
export function formatImprovement(bestMs: number, prevMs: number): string {
  const diffMs = bestMs - prevMs;
  const pct = ((Math.abs(diffMs) / prevMs) * 100).toFixed(2);
  const sign = diffMs < 0 ? '-' : '+';
  return `${sign}${formatTimeMs(Math.abs(diffMs))}s (${pct}%)`;
}
