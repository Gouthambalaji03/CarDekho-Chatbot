import { MongoClient, type Collection } from "mongodb";
import type { CarRecord } from "../types";
import { ENV } from "./env";

/**
 * Cached Mongo client. In dev, Next.js hot-reloads modules, so we stash the
 * client on `globalThis` to avoid exhausting connections across reloads.
 */
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

function clientPromise(): Promise<MongoClient> {
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(ENV.mongoUri());
    globalForMongo._mongoClientPromise = client.connect();
  }
  return globalForMongo._mongoClientPromise;
}

export async function carsCollection(): Promise<Collection<CarRecord>> {
  const client = await clientPromise();
  return client.db(ENV.mongoDb()).collection<CarRecord>("cars");
}
