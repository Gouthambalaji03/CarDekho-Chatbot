/** Shared domain + UI types for the CarDekho Advisor frontend. */

export type BodyType = "SUV" | "Hatchback" | "Sedan" | "MPV";
export type FuelType = "Petrol" | "Diesel" | "CNG" | "EV";
export type Transmission = "Manual" | "Automatic";

/** A car record as shown in the dataset / admin surface. */
export interface Car {
  id: string;
  make: string;
  model: string;
  variant: string;
  price: number; // ₹ lakh
  body: BodyType;
  fuel: FuelType;
  mileage: number; // kmpl
  safety: number; // ★ 1–5
  features: string[];
  /** true while the "just embedded · searchable now" flash is active */
  justAdded?: boolean;
}

/** A ranked recommendation in the advisor shortlist. */
export interface ShortlistCar {
  make: string;
  model: string;
  variant: string;
  price: number;
  mileage: number;
  fuel: FuelType;
  safety: number;
  rank: number;
  match: number; // 0–100 fit score
  reason: string; // grounded one-liner
}

/** Conversation message kinds rendered in the advisor stream. */
export type MessageKind =
  | "user"
  | "agent"
  | "questionnaire"
  | "searching"
  | "shortlist";

export interface Message {
  id: number;
  kind: MessageKind;
  text?: string;
  // searching state
  active?: boolean;
  done?: boolean;
  // shortlist payload
  cars?: ShortlistCar[];
}

/** Questionnaire answer state. */
export interface QA {
  budget: string;
  usage: string[];
  seating: string;
  fuel: string;
  priorities: string[];
  notes: string;
}

/** A single questionnaire question definition. */
export interface QuestionDef {
  id: keyof Omit<QA, "notes">;
  title: string;
  hint: string;
  multi: boolean;
  options: { label: string; value: string }[];
}

/** Admin create-form state (all strings, as typed). */
export interface CarForm {
  make: string;
  model: string;
  variant: string;
  price: string;
  mileage: string;
  body: BodyType;
  fuel: FuelType;
  transmission: Transmission;
  safety: string;
  features: string;
  review: string;
}
