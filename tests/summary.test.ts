import { describe, it, expect } from "vitest";
import { buildSummary } from "@/lib/summary";
import type { CarInput } from "@/lib/types";

describe("buildSummary (plan §8.3)", () => {
  const car: CarInput = {
    make: "Tata",
    model: "Nexon",
    variant: "Creative+ S AMT",
    price: 13.6,
    body: "SUV",
    fuel: "Petrol",
    transmission: "Automatic",
    mileage: 17.4,
    safety: 5,
    features: ["6 airbags", "Sunroof", "360 camera"],
    review: "Feels rock solid on the highway.",
  };

  it("maps a record to the expected summary string", () => {
    expect(buildSummary(car)).toBe(
      "Tata Nexon Creative+ S AMT. SUV, Petrol, Automatic. Priced at ₹13.6 lakh. " +
        "Mileage 17.4 kmpl. Safety rating 5 out of 5 stars. " +
        "Key features: 6 airbags, Sunroof, 360 camera. Owner review: Feels rock solid on the highway."
    );
  });

  it("omits optional segments cleanly when absent", () => {
    const minimal: CarInput = {
      make: "Maruti Suzuki",
      model: "Swift",
      price: 8.5,
      body: "Hatchback",
      fuel: "Petrol",
      mileage: 24.8,
      safety: 4,
      features: [],
    };
    const out = buildSummary(minimal);
    expect(out).toBe(
      "Maruti Suzuki Swift. Hatchback, Petrol. Priced at ₹8.5 lakh. " +
        "Mileage 24.8 kmpl. Safety rating 4 out of 5 stars."
    );
    expect(out).not.toContain("Key features");
    expect(out).not.toContain("Owner review");
    expect(out).not.toContain("undefined");
  });
});
