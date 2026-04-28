import { clampFontScale, parseStoredFontScale } from '@/lib/preferences'

describe('clampFontScale', () => {
  // --- Within range ---
  it('returns the value unchanged when within [0.85, 1.3]', () => {
    expect(clampFontScale(1.0)).toBe(1.0)
    expect(clampFontScale(1.1)).toBe(1.1)
    expect(clampFontScale(0.9)).toBe(0.9)
  })

  // --- Boundary values ---
  it('returns 0.85 exactly at the lower boundary', () => {
    expect(clampFontScale(0.85)).toBe(0.85)
  })

  it('returns 1.3 exactly at the upper boundary', () => {
    expect(clampFontScale(1.3)).toBe(1.3)
  })

  // --- Clamping ---
  it('clamps values below 0.85 to 0.85', () => {
    expect(clampFontScale(0.5)).toBe(0.85)
    expect(clampFontScale(0)).toBe(0.85)
    expect(clampFontScale(-1)).toBe(0.85)
  })

  it('clamps values above 1.3 to 1.3', () => {
    expect(clampFontScale(1.5)).toBe(1.3)
    expect(clampFontScale(100)).toBe(1.3)
    expect(clampFontScale(Infinity)).toBe(1.3)
  })

  // --- NaN handling ---
  it('returns 1 when value is NaN', () => {
    expect(clampFontScale(NaN)).toBe(1)
  })
})

describe('parseStoredFontScale', () => {
  // --- Null / empty ---
  it('returns 1 for null', () => {
    expect(parseStoredFontScale(null)).toBe(1)
  })

  it('returns 1 for empty string (falsy)', () => {
    expect(parseStoredFontScale('')).toBe(1)
  })

  // --- Valid numeric strings ---
  it('parses a valid in-range string', () => {
    expect(parseStoredFontScale('1.0')).toBe(1.0)
    expect(parseStoredFontScale('1.15')).toBe(1.15)
    expect(parseStoredFontScale('0.85')).toBe(0.85)
    expect(parseStoredFontScale('1.3')).toBe(1.3)
  })

  // --- Out-of-range strings — clamped ---
  it('clamps an out-of-range string to the lower bound', () => {
    expect(parseStoredFontScale('0.5')).toBe(0.85)
  })

  it('clamps an out-of-range string to the upper bound', () => {
    expect(parseStoredFontScale('2.0')).toBe(1.3)
  })

  // --- Non-numeric strings ---
  it('returns 1 for a non-numeric string (NaN after parseFloat)', () => {
    expect(parseStoredFontScale('abc')).toBe(1)
  })

  it('returns 1 for a string that starts with letters', () => {
    expect(parseStoredFontScale('xyz1.0')).toBe(1)
  })

  // --- Strings with leading numerics (parseFloat behaviour) ---
  it('handles a string with trailing non-numeric characters using parseFloat semantics', () => {
    // parseFloat('1.0abc') => 1.0, then clamped to 1.0
    expect(parseStoredFontScale('1.0abc')).toBe(1.0)
  })
})
