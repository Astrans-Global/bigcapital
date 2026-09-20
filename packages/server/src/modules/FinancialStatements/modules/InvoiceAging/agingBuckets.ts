export const OUTSTANDING_AGING_BUCKETS = [
  { key: 'b0_30', label: '0-30', min: 0, max: 30 },
  { key: 'b31_60', label: '31-60', min: 31, max: 60 },
  { key: 'b61_80', label: '61-80', min: 61, max: 80 },
  { key: 'b81_90', label: '81-90', min: 81, max: 90 },
  { key: 'b91_120', label: '91-120', min: 91, max: 120 },
  { key: 'b121_150', label: '121-150', min: 121, max: 150 },
  { key: 'b151_270', label: '151-270', min: 151, max: 270 },
  { key: 'b271_360', label: '271-360', min: 271, max: 360 },
  { key: 'b_gt_360', label: '>360', min: 361, max: Number.POSITIVE_INFINITY },
];

export function daysBetween(fromDate: string | Date, asDate: string | Date) {
  const from = new Date(fromDate);
  const to = new Date(asDate);
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export function bucketKeyForDays(days: number) {
  const bucket = OUTSTANDING_AGING_BUCKETS.find(
    (item) => days >= item.min && days <= item.max,
  );
  return (bucket || OUTSTANDING_AGING_BUCKETS[OUTSTANDING_AGING_BUCKETS.length - 1]).key;
}

export function emptyBuckets() {
  return Object.fromEntries(
    OUTSTANDING_AGING_BUCKETS.map((bucket) => [bucket.key, 0]),
  ) as Record<string, number>;
}
