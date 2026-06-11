import type { CarRecord, RagCar, RagResult } from "../types";
import { rankTopK } from "../cosine";
import { listCars } from "./cars";
import { embed } from "./gemini";

/** Below this top cosine score we treat the result as too weak to ground on. */
export const WEAK_THRESHOLD = 0.55;
export const DEFAULT_K = 4;

/**
 * Pure ranking core: given a query + its embedding and the catalogue, return
 * the top-k cars by cosine similarity and whether the match is too weak.
 * No I/O — unit-testable offline (plan §8.5).
 */
export function rankCars(
  query: string,
  queryVec: number[],
  cars: CarRecord[],
  k = DEFAULT_K,
  threshold = WEAK_THRESHOLD
): RagResult {
  const ranked = rankTopK(queryVec, cars, (c) => c.embedding, k);
  const out: RagCar[] = ranked.map(({ item, score }) => ({
    id: item.id,
    make: item.make,
    model: item.model,
    variant: item.variant,
    price: item.price,
    body: item.body,
    fuel: item.fuel,
    mileage: item.mileage,
    safety: item.safety,
    features: item.features,
    review: item.review,
    score,
  }));
  const weak = out.length === 0 || out[0].score < threshold;
  return { query, cars: out, weak };
}

/**
 * RAG tool implementation (plan §4, Tool 2): embed the phrase, rank against
 * stored car embeddings via in-memory cosine similarity, return top-k.
 */
export async function ragSearch(query: string, k = DEFAULT_K): Promise<RagResult> {
  const [queryVec, cars] = await Promise.all([embed(query), listCars()]);
  return rankCars(query, queryVec, cars, k);
}
