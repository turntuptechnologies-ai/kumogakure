/**
 * Parse an environment-variable string as a positive integer.
 *
 * Returns the parsed value when `raw` is a finite integer > 0, and
 * `undefined` otherwise (missing, non-numeric, zero, or negative). Callers
 * decide their own fallback or skip policy — a config knob with a safe
 * default coalesces to that default, while a destructive one (retention)
 * skips the operation entirely rather than guessing.
 */
export function parsePositiveInt(raw: string | undefined): number | undefined {
  const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
