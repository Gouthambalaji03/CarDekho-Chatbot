import { randomUUID } from "node:crypto";
import type { CarInput, CarRecord } from "../types";
import { buildSummary } from "../summary";
import { carsCollection } from "./db";
import { embed } from "./gemini";

/**
 * THE single create path (plan §5): build the text summary → generate the
 * embedding → write record + embedding to MongoDB, in one step. Any new car is
 * immediately RAG-retrievable. The seed script reuses this exact function, so
 * there is no duplicated embedding logic and every embedding comes from the
 * same model — keeping cosine comparison valid.
 */
export async function createCar(input: CarInput): Promise<CarRecord> {
  const summary = buildSummary(input);
  const embedding = await embed(summary);

  const record: CarRecord = {
    id: randomUUID(),
    make: input.make.trim(),
    model: input.model.trim(),
    variant: input.variant?.trim() || "—",
    price: input.price,
    body: input.body,
    fuel: input.fuel,
    transmission: input.transmission,
    mileage: input.mileage,
    safety: input.safety,
    features: input.features.map((f) => f.trim()).filter(Boolean),
    review: input.review?.trim() || undefined,
    summary,
    embedding,
    createdAt: new Date().toISOString(),
  };

  const col = await carsCollection();
  await col.insertOne(record as CarRecord & { _id?: never });
  return record;
}

/** All cars, newest first. `_id` is dropped so the result is plain JSON. */
export async function listCars(): Promise<CarRecord[]> {
  const col = await carsCollection();
  const docs = await col
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs as CarRecord[];
}
