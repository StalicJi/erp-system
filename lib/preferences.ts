export const FONT_SCALE_STORAGE_KEY = "erp_font_scale";

export function clampFontScale(value: number): number {
  if (Number.isNaN(value)) return 1;
  return Math.min(1.3, Math.max(0.85, value));
}

export function parseStoredFontScale(raw: string | null): number {
  if (!raw) return 1;
  const parsed = Number.parseFloat(raw);
  return clampFontScale(parsed);
}
