import type { Car } from "./types";

/**
 * Pre-seeded catalogue used as an offline fallback on the Dataset surface when
 * the backend isn't reachable. The live catalogue comes from /api/cars; the
 * authoritative seed for the database lives in scripts/seed.ts.
 */
const SEED_RAW: Omit<Car, "id" | "justAdded">[] = [
  { make: "Tata", model: "Nexon", variant: "Creative+ S AMT", price: 13.6, body: "SUV", fuel: "Petrol", mileage: 17.4, safety: 5, features: ["6 airbags", "Sunroof", "360 camera"] },
  { make: "Hyundai", model: "Creta", variant: "SX (O) Turbo", price: 17.5, body: "SUV", fuel: "Petrol", mileage: 16.8, safety: 5, features: ["ADAS", "Ventilated seats", "Pano sunroof"] },
  { make: "Kia", model: "Seltos", variant: "GTX+ DCT", price: 18.2, body: "SUV", fuel: "Petrol", mileage: 17.0, safety: 5, features: ["ADAS", "Bose audio", "Dual screens"] },
  { make: "Maruti Suzuki", model: "Brezza", variant: "ZXi+ AT", price: 12.8, body: "SUV", fuel: "Petrol", mileage: 19.8, safety: 4, features: ["6 airbags", "Sunroof", "360 cam"] },
  { make: "Maruti Suzuki", model: "Swift", variant: "ZXi+ MT", price: 8.5, body: "Hatchback", fuel: "Petrol", mileage: 24.8, safety: 4, features: ["6 airbags", "Cruise control"] },
  { make: "Mahindra", model: "XUV700", variant: "AX7 L", price: 24.5, body: "SUV", fuel: "Petrol", mileage: 13.0, safety: 5, features: ["ADAS", "7 seats", 'Dual 10" screens'] },
  { make: "Tata", model: "Punch", variant: "Creative MT", price: 8.9, body: "SUV", fuel: "Petrol", mileage: 20.1, safety: 5, features: ["Dual airbags", "Sunroof"] },
  { make: "Hyundai", model: "Venue", variant: "SX MT", price: 11.9, body: "SUV", fuel: "Petrol", mileage: 18.0, safety: 4, features: ["6 airbags", "Sunroof"] },
  { make: "Honda", model: "City", variant: "ZX CVT", price: 16.5, body: "Sedan", fuel: "Petrol", mileage: 18.4, safety: 5, features: ["ADAS", "Sunroof"] },
  { make: "Maruti Suzuki", model: "Baleno", variant: "Alpha AT", price: 9.9, body: "Hatchback", fuel: "Petrol", mileage: 22.3, safety: 4, features: ["6 airbags", "HUD", "360 cam"] },
  { make: "Toyota", model: "Innova Crysta", variant: "ZX AT", price: 25.0, body: "MPV", fuel: "Diesel", mileage: 14.0, safety: 4, features: ["7 seats", "Captain seats"] },
  { make: "Mahindra", model: "Thar", variant: "LX 4WD AT", price: 17.6, body: "SUV", fuel: "Diesel", mileage: 15.2, safety: 4, features: ["4x4", "Off-road modes"] },
];

export const SEED: Car[] = SEED_RAW.map((c, i) => ({
  ...c,
  id: "seed-" + i,
  justAdded: false,
}));

/** Welcome-state suggestion chips. */
export const SUGGESTIONS: { icon: string; label: string; text: string }[] = [
  { icon: "◆", label: "First car for my family", text: "Looking for my family’s first car — not sure where to start." },
  { icon: "▲", label: "Upgrade from my hatchback", text: "I want to upgrade from my old hatchback to something roomier." },
  { icon: "●", label: "Best mileage under ₹10L", text: "What’s the best mileage I can get under ₹10 lakh?" },
  { icon: "■", label: "Safe car for highway trips", text: "I do a lot of highway driving and want something really safe." },
];
