import { describe, it, expect } from 'vitest';
import { formatMs, formatSeconds, timeDeltaMs, formatTimeDelta } from '../formatTime';

describe('formatMs', () => {
  it('formats sub-minute times as ss.mmm', () => {
    expect(formatMs(38241)).toBe('38.241');
  });

  it('formats over-minute times as m:ss.mmm', () => {
    expect(formatMs(75500)).toBe('1:15.500');
  });

  it('pads seconds to 6 chars when minutes > 0', () => {
    expect(formatMs(63000)).toBe('1:03.000');
  });

  it('returns — for negative values', () => {
    expect(formatMs(-1)).toBe('—');
  });

  it('returns — for NaN', () => {
    expect(formatMs(NaN)).toBe('—');
  });

  it('handles zero', () => {
    expect(formatMs(0)).toBe('0.000');
  });

  it('handles exact minute boundary', () => {
    expect(formatMs(60000)).toBe('1:00.000');
  });

  it('handles 300m sprint time correctly (26.5s)', () => {
    expect(formatMs(26500)).toBe('26.500');
  });

  it('handles marathon-level (10 minutes)', () => {
    expect(formatMs(600000)).toBe('10:00.000');
  });
});

describe('formatSeconds', () => {
  it('formats seconds as ss.mmm', () => {
    expect(formatSeconds(41.512)).toBe('41.512');
  });

  it('formats over-minute in m:ss.mmm', () => {
    expect(formatSeconds(75.5)).toBe('1:15.500');
  });

  it('returns — for null', () => {
    expect(formatSeconds(null)).toBe('—');
  });

  it('returns — for negative', () => {
    expect(formatSeconds(-5)).toBe('—');
  });
});

describe('timeDeltaMs', () => {
  it('returns positive delta when current time improves (lower)', () => {
    expect(timeDeltaMs(38000, 39000)).toBe(1000);
  });

  it('returns negative delta when current time regresses', () => {
    expect(timeDeltaMs(40000, 38000)).toBe(-2000);
  });

  it('returns 0 for equal times', () => {
    expect(timeDeltaMs(38241, 38241)).toBe(0);
  });
});

describe('formatTimeDelta', () => {
  it('adds + sign for positive delta (improvement)', () => {
    expect(formatTimeDelta(0.5)).toBe('+0.500s');
  });

  it('keeps - sign for negative delta (regression)', () => {
    expect(formatTimeDelta(-0.3)).toBe('-0.300s');
  });

  it('formats zero correctly (no sign — zero is not a positive delta)', () => {
    expect(formatTimeDelta(0)).toBe('0.000s');
  });
});
