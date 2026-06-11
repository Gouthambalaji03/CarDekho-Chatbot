import type { CarInput } from "./types";

/**
 * Build the text summary that gets embedded for RAG. This is the single
 * source of truth for a car's searchable text — the same builder runs on
 * create and on seed, so every embedding is produced identically.
 *
 * Pure function: no I/O, fully unit-testable offline (plan §8.3).
 */
export function buildSummary(car: CarInput): string {
  const variant = car.variant?.trim() ? ` ${car.variant.trim()}` : "";
  const features = car.features.filter(Boolean).join(", ");
  const parts = [
    `${car.make} ${car.model}${variant}.`,
    `${car.body}, ${car.fuel}${car.transmission ? `, ${car.transmission}` : ""}.`,
    `Priced at ₹${car.price} lakh.`,
    `Mileage ${car.mileage} kmpl.`,
    `Safety rating ${car.safety} out of 5 stars.`,
    features ? `Key features: ${features}.` : "",
    car.review?.trim() ? `Owner review: ${car.review.trim()}` : "",
  ];
  return parts.filter(Boolean).join(" ");
}
