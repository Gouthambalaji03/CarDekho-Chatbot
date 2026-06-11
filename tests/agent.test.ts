import { describe, it, expect, vi } from "vitest";
import { runAgent } from "@/lib/agent/loop";
import type { ChatMessage, ModelTurn, RagResult } from "@/lib/types";

const history: ChatMessage[] = [{ role: "user", content: "I need a safe family car." }];

/** A fake model that returns scripted turns in order (last one repeats). */
function scriptedGenerate(turns: ModelTurn[]) {
  // vitest records the call before running this impl, so `calls.length` already
  // counts the current invocation — subtract 1 for the 0-based turn index.
  const fn = vi.fn(async () => turns[Math.min(fn.mock.calls.length - 1, turns.length - 1)]);
  return fn;
}

const ragResult = (weak = false): RagResult => ({
  query: "safe family suv under 15 lakh",
  weak,
  cars: [
    { id: "1", make: "Tata", model: "Nexon", variant: "S", price: 13.6, body: "SUV", fuel: "Petrol", mileage: 17.4, safety: 5, features: ["6 airbags"], score: 0.82 },
  ],
});

describe("agent loop (plan §8.1)", () => {
  it("dispatches the search tool, then returns the model's final message with grounded cars", async () => {
    const generate = scriptedGenerate([
      { functionCall: { name: "search_catalogue", args: { query: "safe family suv under 15 lakh" } } },
      { text: "Here's your shortlist: 1) Tata Nexon — 5-star safety, under budget." },
    ]);
    const rag = vi.fn(async () => ragResult());

    const result = await runAgent(history, { generate, rag });

    expect(rag).toHaveBeenCalledWith("safe family suv under 15 lakh");
    expect(result.type).toBe("message");
    if (result.type === "message") {
      expect(result.content).toContain("Tata Nexon");
      expect(result.cars).toHaveLength(1);
      expect(result.cars[0].model).toBe("Nexon");
    }
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("questionnaire tool call exits the loop and returns control", async () => {
    const generate = scriptedGenerate([
      {
        functionCall: {
          name: "ask_questionnaire",
          args: {
            intro: "A few quick questions.",
            questions: [{ id: "budget", title: "Budget", options: [{ label: "₹8–12L", value: "8-12" }] }],
          },
        },
      },
      { text: "should never be reached" },
    ]);
    const rag = vi.fn(async () => ragResult());

    const result = await runAgent(history, { generate, rag });

    expect(result.type).toBe("questionnaire");
    if (result.type === "questionnaire") {
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].id).toBe("budget");
    }
    expect(generate).toHaveBeenCalledTimes(1); // exited immediately
    expect(rag).not.toHaveBeenCalled();
  });

  it("stops at the max-iteration cap instead of looping forever", async () => {
    // model keeps calling search every turn
    const generate = scriptedGenerate([
      { functionCall: { name: "search_catalogue", args: { query: "suv" } } },
    ]);
    const rag = vi.fn(async () => ragResult());

    const result = await runAgent(history, { generate, rag, maxIterations: 3 });

    expect(result.type).toBe("message");
    expect(generate).toHaveBeenCalledTimes(3);
    expect(rag).toHaveBeenCalledTimes(3);
  });

  it("fails soft on malformed tool args (no throw), letting the model recover", async () => {
    const generate = scriptedGenerate([
      { functionCall: { name: "search_catalogue", args: {} } }, // missing query
      { text: "Could you share your budget?" },
    ]);
    const rag = vi.fn(async () => ragResult());

    const result = await runAgent(history, { generate, rag });

    expect(rag).not.toHaveBeenCalled(); // invalid args never reach RAG
    expect(result.type).toBe("message");
    if (result.type === "message") expect(result.content).toContain("budget");
    expect(generate).toHaveBeenCalledTimes(2); // recovered on next turn
  });

  it("passes a weak-result signal through so the model can ask a clarifying question", async () => {
    const generate = scriptedGenerate([
      { functionCall: { name: "search_catalogue", args: { query: "flying car" } } },
      { text: "I couldn't find a strong match — what's your budget range?" },
    ]);
    const rag = vi.fn(async () => ragResult(true));

    const result = await runAgent(history, { generate, rag });
    expect(result.type).toBe("message");
    if (result.type === "message") expect(result.content).toContain("budget");
  });
});
