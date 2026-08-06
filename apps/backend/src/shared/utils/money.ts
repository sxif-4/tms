/**
 * Money is `decimal(10,2)` stored as text everywhere in this schema, never a
 * float. Validation only proves a value *looks* like money — `"23"` passes the
 * same `^\d+(\.\d{1,2})?$` check as `"23.00"` — so every write normalises here
 * instead, otherwise the same price lands in the database in two shapes and
 * reports, receipts and price snapshots disagree about what a thing costs.
 *
 * Purchase totals were already doing this inline (`(price * qty).toFixed(2)`);
 * this is the same rule applied to the catalog prices those totals derive from.
 */
export function toMoney(value: number | string): string {
  return Number(value).toFixed(2);
}

/** Normalises an optional money field, leaving `undefined` alone for PATCH. */
export function toMoneyOptional(
  value: number | string | null | undefined,
): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return toMoney(value);
}
