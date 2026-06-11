import { NextResponse } from "next/server";
import type { BodyType, CarInput, FuelType, Transmission } from "@/lib/types";
import { createCar, listCars } from "@/lib/server/cars";

export const runtime = "nodejs";

const BODIES: BodyType[] = ["SUV", "Hatchback", "Sedan", "MPV"];
const FUELS: FuelType[] = ["Petrol", "Diesel", "CNG", "EV"];
const TRANS: Transmission[] = ["Manual", "Automatic"];

export async function GET() {
  try {
    const cars = await listCars();
    return NextResponse.json({ cars });
  } catch (err) {
    console.error("[/api/cars] list error:", err);
    return NextResponse.json(
      { error: "Could not load the catalogue right now." },
      { status: 503 }
    );
  }
}

/** Create a car via the single create handler (summary → embed → Mongo). */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseCarInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const car = await createCar(parsed.value);
    return NextResponse.json({ car }, { status: 201 });
  } catch (err) {
    console.error("[/api/cars] create error:", err);
    return NextResponse.json(
      { error: "Could not embed and save this car right now — please try again." },
      { status: 503 }
    );
  }
}

function parseCarInput(
  b: Record<string, unknown>
): { ok: true; value: CarInput } | { ok: false; error: string } {
  const make = str(b.make);
  const model = str(b.model);
  const price = num(b.price);
  if (!make || !model) return { ok: false, error: "make and model are required." };
  if (price === undefined) return { ok: false, error: "price (₹ lakh) is required and must be a number." };

  const body = BODIES.includes(b.body as BodyType) ? (b.body as BodyType) : "SUV";
  const fuel = FUELS.includes(b.fuel as FuelType) ? (b.fuel as FuelType) : "Petrol";
  const transmission = TRANS.includes(b.transmission as Transmission)
    ? (b.transmission as Transmission)
    : undefined;
  const features = Array.isArray(b.features)
    ? (b.features as unknown[]).map((f) => String(f).trim()).filter(Boolean)
    : str(b.features)
      ? str(b.features)!.split(",").map((f) => f.trim()).filter(Boolean)
      : [];

  return {
    ok: true,
    value: {
      make,
      model,
      variant: str(b.variant),
      price,
      body,
      fuel,
      transmission,
      mileage: num(b.mileage) ?? 0,
      safety: clampInt(num(b.safety) ?? 0, 0, 5),
      features,
      review: str(b.review),
    },
  };
}

const str = (v: unknown): string | undefined => {
  const s = typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
  return s ? s : undefined;
};
const num = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return undefined;
};
const clampInt = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Math.round(n)));
