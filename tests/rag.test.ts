import { describe, it, expect } from "vitest";
import { rankCars, WEAK_THRESHOLD } from "@/lib/server/rag";
import type { CarRecord } from "@/lib/types";

function car(id: string, embedding: number[]): CarRecord {
  return {
    id,
    make: "Make",
    model: id,
    variant: "—",
    price: 10,
    body: "SUV",
    fuel: "Petrol",
    mileage: 18,
    safety: 5,
    features: [],
    summary: "",
    embedding,
    createdAt: "2026-01-01",
  };
}

describe("rankCars / RAG result handling (plan §8.5)", () => {
  const cars = [car("near", [1, 0, 0]), car("mid", [0.6, 0.4, 0]), car("far", [0, 1, 0])];

  it("ranks by similarity and respects top-k", () => {
    const res = rankCars("safe suv", [1, 0, 0], cars, 2);
    expect(res.cars.map((c) => c.model)).toEqual(["near", "mid"]);
    expect(res.cars).toHaveLength(2);
    expect(res.weak).toBe(false);
  });

  it("flags weak when the best match is below threshold", () => {
    // query orthogonal-ish to everything → top score under the weak threshold
    const res = rankCars("spaceship", [0, 0, 1], cars, 3);
    expect(res.cars[0].score).toBeLessThan(WEAK_THRESHOLD);
    expect(res.weak).toBe(true);
  });

  it("flags weak (and returns no cars) for an empty catalogue", () => {
    const res = rankCars("anything", [1, 0, 0], [], 4);
    expect(res.cars).toHaveLength(0);
    expect(res.weak).toBe(true);
  });
});
