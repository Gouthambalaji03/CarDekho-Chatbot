/**
 * In-memory cosine similarity + top-k ranking. Pure functions — no vector
 * index, no I/O, unit-testable offline (plan §3, §8.4). For a small curated
 * catalogue this returns matches in milliseconds.
 */

/** Cosine similarity of two equal-length vectors. Returns 0 for degenerate input. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export interface Ranked<T> {
  item: T;
  score: number;
}

/**
 * Rank items by cosine similarity of `getVector(item)` against `query`,
 * returning the top `k` in descending score order.
 */
export function rankTopK<T>(
  query: number[],
  items: T[],
  getVector: (item: T) => number[],
  k: number
): Ranked<T>[] {
  return items
    .map((item) => ({ item, score: cosineSimilarity(query, getVector(item)) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, Math.max(0, k));
}
