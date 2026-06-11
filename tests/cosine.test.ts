import { describe, it, expect } from "vitest";
import { cosineSimilarity, rankTopK } from "@/lib/cosine";

describe("cosine similarity (plan §8.4)", () => {
  it("is 1 for identical direction, 0 for orthogonal", () => {
    expect(cosineSimilarity([1, 0], [2, 0])).toBeCloseTo(1, 6);
    expect(cosineSimilarity([1, 0], [0, 5])).toBeCloseTo(0, 6);
  });

  it("returns 0 for degenerate (empty / mismatched / zero) vectors", () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([1, 2], [1])).toBe(0);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe("rankTopK (plan §8.4)", () => {
  const query = [1, 0, 0];
  const items = [
    { id: "a", v: [0.9, 0.1, 0] }, // closest
    { id: "b", v: [0, 1, 0] }, // orthogonal
    { id: "c", v: [0.6, 0.4, 0] }, // middle
  ];
  const get = (i: (typeof items)[number]) => i.v;

  it("returns items in descending similarity order", () => {
    const ranked = rankTopK(query, items, get, 3);
    expect(ranked.map((r) => r.item.id)).toEqual(["a", "c", "b"]);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    expect(ranked[1].score).toBeGreaterThan(ranked[2].score);
  });

  it("respects k", () => {
    const ranked = rankTopK(query, items, get, 2);
    expect(ranked).toHaveLength(2);
    expect(ranked.map((r) => r.item.id)).toEqual(["a", "c"]);
  });
});
