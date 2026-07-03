/** Domains in fixed order — colours map to the validated series CSS vars. */
export const DOMAINS = [
  { key: "hotel", label: "Hotel", color: "var(--series-hotel)" },
  { key: "ferry", label: "Ferry", color: "var(--series-ferry)" },
  { key: "park", label: "Theme park", color: "var(--series-park)" },
  { key: "event", label: "Events", color: "var(--series-event)" },
] as const;

export type DomainKey = (typeof DOMAINS)[number]["key"];

export const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
