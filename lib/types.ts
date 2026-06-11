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

/**
 * A car as stored in MongoDB: the public spec fields plus the derived
 * text summary and its 768-dim embedding. One create path builds all three.
 */
export interface CarRecord {
  id: string;
  make: string;
  model: string;
  variant: string;
  price: number;
  body: BodyType;
  fuel: FuelType;
  transmission?: Transmission;
  mileage: number;
  safety: number;
  features: string[];
  review?: string;
  /** text summary fed to the embedding model (single source for RAG) */
  summary: string;
  /** 768-dim embedding from text-embedding-004, stored as a plain array */
  embedding: number[];
  createdAt: string;
}

/** Input to the single create handler (no embedding/summary — those are derived). */
export interface CarInput {
  make: string;
  model: string;
  variant?: string;
  price: number;
  body: BodyType;
  fuel: FuelType;
  transmission?: Transmission;
  mileage: number;
  safety: number;
  features: string[];
  review?: string;
}

/* ── Agent / chat contracts ─────────────────────────────────────────────── */

/** A persisted conversation turn exchanged with /api/chat. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** A car returned from RAG, with its cosine similarity to the query. */
export interface RagCar {
  id: string;
  make: string;
  model: string;
  variant: string;
  price: number;
  body: BodyType;
  fuel: FuelType;
  mileage: number;
  safety: number;
  features: string[];
  review?: string;
  /** cosine similarity 0–1 */
  score: number;
}

export interface RagResult {
  query: string;
  cars: RagCar[];
  /** true when the top match is too weak to ground a confident recommendation */
  weak: boolean;
}

/** A question the LLM asks via the questionnaire tool (drives the form). */
export interface QuestionnaireQuestion {
  id: string;
  title: string;
  hint?: string;
  multi?: boolean;
  options: { label: string; value: string }[];
}

/** What a single model turn produced: either text, or a tool call. */
export interface ModelTurn {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
}

/** Gemini-shaped content the loop accumulates and replays. */
export interface ModelContent {
  role: "user" | "model";
  parts: unknown[];
}

/** Abstraction over the LLM call so the agent loop is unit-testable. */
export type GenerateFn = (contents: ModelContent[]) => Promise<ModelTurn>;

/** Abstraction over RAG retrieval so the agent loop is unit-testable. */
export type RagFn = (query: string, k?: number) => Promise<RagResult>;

/** Injected dependencies for the agent loop (keeps it Gemini/Mongo-free). */
export interface AgentDeps {
  generate: GenerateFn;
  rag: RagFn;
  maxIterations?: number;
}

/** The agent loop's outcome for one /api/chat request. */
export type AgentResult =
  | { type: "questionnaire"; intro: string; questions: QuestionnaireQuestion[] }
  | { type: "message"; content: string; cars: RagCar[]; searchedQuery?: string };

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
