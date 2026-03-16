export function pickWeightedRandom<T>(items: { value: T; score: number }[]): T {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.score), 0);
  if (total <= 0) {
    return items[0]?.value;
  }
  let r = Math.random() * total;
  for (const item of items) {
    r -= Math.max(0, item.score);
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}
