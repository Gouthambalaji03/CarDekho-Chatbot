/** Thin browser-side fetch helpers for the API routes. */
import type { AgentResult, CarRecord, ChatMessage } from "./types";

export async function postChat(messages: ChatMessage[]): Promise<AgentResult> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    return {
      type: "message",
      content:
        "I'm having trouble reaching the model right now — please try again in a moment.",
      cars: [],
    };
  }
  return (await res.json()) as AgentResult;
}

export async function getCars(): Promise<CarRecord[]> {
  const res = await fetch("/api/cars", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load catalogue");
  const data = await res.json();
  return (data.cars ?? []) as CarRecord[];
}

export async function createCarApi(
  input: Record<string, unknown>
): Promise<{ ok: true; car: CarRecord } | { ok: false; error: string }> {
  const res = await fetch("/api/cars", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data?.error || "Could not add the car." };
  return { ok: true, car: data.car as CarRecord };
}
