/**
 * Seed the catalogue (plan §5). Reuses the SAME create handler as the API in a
 * loop, so every embedding is produced identically and any seeded car is
 * immediately RAG-retrievable. Idempotent: clears the collection first.
 *
 *   npm run seed
 */
import { config } from "dotenv";
import type { CarInput } from "../lib/types";
import { createCar } from "../lib/server/cars";
import { carsCollection } from "../lib/server/db";

// Load .env.local (Next convention) then .env as fallback.
config({ path: ".env.local" });
config();

const CARS: CarInput[] = [
  { make: "Tata", model: "Nexon", variant: "Creative+ S AMT", price: 13.6, body: "SUV", fuel: "Petrol", transmission: "Automatic", mileage: 17.4, safety: 5, features: ["6 airbags", "Sunroof", "360 camera"], review: "Feels rock solid and the 5-star safety gives real peace of mind in city traffic." },
  { make: "Hyundai", model: "Creta", variant: "SX (O) Turbo", price: 17.5, body: "SUV", fuel: "Petrol", transmission: "Automatic", mileage: 16.8, safety: 5, features: ["ADAS", "Ventilated seats", "Pano sunroof"], review: "Spacious, plush cabin and very composed on long highway runs." },
  { make: "Kia", model: "Seltos", variant: "GTX+ DCT", price: 18.2, body: "SUV", fuel: "Petrol", transmission: "Automatic", mileage: 17.0, safety: 5, features: ["ADAS", "Bose audio", "Dual screens"], review: "Loaded with tech and the ADAS makes weekend highway trips relaxed." },
  { make: "Maruti Suzuki", model: "Brezza", variant: "ZXi+ AT", price: 12.8, body: "SUV", fuel: "Petrol", transmission: "Automatic", mileage: 19.8, safety: 4, features: ["6 airbags", "Sunroof", "360 cam"], review: "Easy to park, frugal, and cheap to maintain — a no-fuss family SUV." },
  { make: "Maruti Suzuki", model: "Swift", variant: "ZXi+ MT", price: 8.5, body: "Hatchback", fuel: "Petrol", transmission: "Manual", mileage: 24.8, safety: 4, features: ["6 airbags", "Cruise control"], review: "Light, peppy and incredibly fuel efficient for daily commutes." },
  { make: "Mahindra", model: "XUV700", variant: "AX7 L", price: 24.5, body: "SUV", fuel: "Petrol", transmission: "Automatic", mileage: 13.0, safety: 5, features: ["ADAS", "7 seats", 'Dual 10" screens'], review: "Commanding road presence, 7 seats and genuinely strong crash safety." },
  { make: "Tata", model: "Punch", variant: "Creative MT", price: 8.9, body: "SUV", fuel: "Petrol", transmission: "Manual", mileage: 20.1, safety: 5, features: ["Dual airbags", "Sunroof"], review: "Tiny SUV with a 5-star rating — perfect first car for nervous drivers." },
  { make: "Hyundai", model: "Venue", variant: "SX MT", price: 11.9, body: "SUV", fuel: "Petrol", transmission: "Manual", mileage: 18.0, safety: 4, features: ["6 airbags", "Sunroof"], review: "Compact, feature-rich and easy to live with in tight city lanes." },
  { make: "Honda", model: "City", variant: "ZX CVT", price: 16.5, body: "Sedan", fuel: "Petrol", transmission: "Automatic", mileage: 18.4, safety: 5, features: ["ADAS", "Sunroof"], review: "Refined, comfortable sedan that still feels premium on the highway." },
  { make: "Maruti Suzuki", model: "Baleno", variant: "Alpha AT", price: 9.9, body: "Hatchback", fuel: "Petrol", transmission: "Automatic", mileage: 22.3, safety: 4, features: ["6 airbags", "HUD", "360 cam"], review: "Roomy premium hatch with great mileage and a feather-light automatic." },
  { make: "Toyota", model: "Innova Crysta", variant: "ZX AT", price: 25.0, body: "MPV", fuel: "Diesel", transmission: "Automatic", mileage: 14.0, safety: 4, features: ["7 seats", "Captain seats"], review: "Unbeatable for big families and long trips — bulletproof reliability." },
  { make: "Mahindra", model: "Thar", variant: "LX 4WD AT", price: 17.6, body: "SUV", fuel: "Diesel", transmission: "Automatic", mileage: 15.2, safety: 4, features: ["4x4", "Off-road modes"], review: "Pure weekend fun — proper 4x4 capability and tons of character." },
];

async function main() {
  console.log(`Seeding ${CARS.length} cars…`);
  const col = await carsCollection();
  const cleared = await col.deleteMany({});
  console.log(`Cleared ${cleared.deletedCount} existing cars.`);

  let n = 0;
  for (const car of CARS) {
    const saved = await createCar(car);
    n++;
    console.log(`  ✓ [${n}/${CARS.length}] ${saved.make} ${saved.model} (${saved.embedding.length}-dim embedding)`);
  }
  console.log(`Done. ${n} cars embedded and written to MongoDB.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
