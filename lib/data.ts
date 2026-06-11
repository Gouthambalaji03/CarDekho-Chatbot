import type { Car, QuestionDef, ShortlistCar } from "./types";

/** Demo shortlist returned after the questionnaire (grounded reasons). */
export const SHORTLIST: ShortlistCar[] = [
  {
    make: "Tata",
    model: "Nexon",
    variant: "Creative+ S AMT",
    price: 13.6,
    mileage: 17.4,
    fuel: "Petrol",
    safety: 5,
    rank: 1,
    match: 96,
    reason:
      "5-star Global NCAP safety with 6 airbags, and at ₹13.6L it sits comfortably under your budget with room for accessories.",
  },
  {
    make: "Hyundai",
    model: "Creta",
    variant: "SX (O) Turbo",
    price: 17.5,
    mileage: 16.8,
    fuel: "Petrol",
    safety: 5,
    rank: 2,
    match: 91,
    reason:
      "The most cabin space and highway composure in your range — 5-star safety and the strongest resale story of the four.",
  },
  {
    make: "Kia",
    model: "Seltos",
    variant: "GTX+ DCT",
    price: 18.2,
    mileage: 17.0,
    fuel: "Petrol",
    safety: 5,
    rank: 3,
    match: 88,
    reason:
      "Comes with ADAS for safer highway runs and a planted, confident ride that suits the long weekend drives you mentioned.",
  },
  {
    make: "Maruti Suzuki",
    model: "Brezza",
    variant: "ZXi+ AT",
    price: 12.8,
    mileage: 19.8,
    fuel: "Petrol",
    safety: 4,
    rank: 4,
    match: 84,
    reason:
      "Easiest of the lot to own and park in the city, a frugal petrol automatic, and the sunroof the family asked for.",
  },
];

/** Pre-seeded catalogue shown on the Dataset / admin surface. */
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

/** The questionnaire tool's questions — "only what changes the answer". */
export const QUESTIONS: QuestionDef[] = [
  {
    id: "budget",
    title: "Budget",
    hint: "on-road, ballpark",
    multi: false,
    options: [
      { label: "Under ₹8L", value: "u8" },
      { label: "₹8–12L", value: "8-12" },
      { label: "₹12–18L", value: "12-18" },
      { label: "₹18L+", value: "18+" },
    ],
  },
  {
    id: "usage",
    title: "Mostly for",
    hint: "pick all that apply",
    multi: true,
    options: [
      { label: "City commute", value: "city" },
      { label: "Highway trips", value: "highway" },
      { label: "Family duty", value: "family" },
      { label: "Weekend fun", value: "fun" },
    ],
  },
  {
    id: "seating",
    title: "Seats you need",
    hint: "",
    multi: false,
    options: [
      { label: "5 is plenty", value: "5" },
      { label: "6–7 seats", value: "7" },
    ],
  },
  {
    id: "fuel",
    title: "Fuel preference",
    hint: "",
    multi: false,
    options: [
      { label: "Petrol", value: "Petrol" },
      { label: "Diesel", value: "Diesel" },
      { label: "CNG", value: "CNG" },
      { label: "Open to anything", value: "any" },
    ],
  },
  {
    id: "priorities",
    title: "What matters most",
    hint: "pick all that apply",
    multi: true,
    options: [
      { label: "Safety", value: "safety" },
      { label: "Mileage", value: "mileage" },
      { label: "Space", value: "space" },
      { label: "Features", value: "features" },
      { label: "Resale value", value: "resale" },
    ],
  },
];
