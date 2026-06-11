import type {
  AgentDeps,
  AgentResult,
  ChatMessage,
  ModelContent,
  RagCar,
} from "../types";
import {
  QUESTIONNAIRE_TOOL,
  SEARCH_TOOL,
  validateQuestionnaireArgs,
  validateSearchArgs,
} from "./tools";

export const MAX_ITERATIONS = 6;

const FALLBACK_NO_TEXT =
  "I want to get this right — could you tell me a bit more about your budget and how you'll mainly use the car?";
const FALLBACK_CAP =
  "Let me pause there so I don't go in circles. Could you confirm your budget and must-haves, and I'll pull a focused shortlist?";

/** Map persisted chat turns into Gemini-shaped contents. */
export function historyToContents(history: ChatMessage[]): ModelContent[] {
  return history
    .filter((m) => m.content && m.content.trim())
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

function pushCall(contents: ModelContent[], name: string, args: Record<string, unknown>) {
  contents.push({ role: "model", parts: [{ functionCall: { name, args } }] });
}
function pushResponse(contents: ModelContent[], name: string, response: unknown) {
  contents.push({ role: "user", parts: [{ functionResponse: { name, response } }] });
}

/** Compact, grounded view of a retrieved car for the model to reason over. */
function carForModel(c: RagCar) {
  return {
    name: `${c.make} ${c.model} ${c.variant}`.trim(),
    price_lakh: c.price,
    body: c.body,
    fuel: c.fuel,
    mileage_kmpl: c.mileage,
    safety_stars: c.safety,
    features: c.features,
    review: c.review,
    similarity: Number(c.score.toFixed(3)),
  };
}

/**
 * The agent loop (plan §6). Operates over the full conversation history,
 * dispatches the two tools, enforces a max-iteration cap, and fails soft on
 * bad tool args. `generate` and `rag` are injected so the loop is a pure,
 * unit-testable function with no Gemini/Mongo dependency (plan §8.1, §8.2).
 *
 * - questionnaire tool call → exits the loop, returns control to the user.
 * - search tool call → runs RAG, appends the result, continues.
 * - plain text → final answer.
 */
export async function runAgent(
  history: ChatMessage[],
  deps: AgentDeps
): Promise<AgentResult> {
  const { generate, rag } = deps;
  const maxIterations = deps.maxIterations ?? MAX_ITERATIONS;
  const contents = historyToContents(history);

  let lastCars: RagCar[] = [];
  let lastQuery: string | undefined;

  for (let i = 0; i < maxIterations; i++) {
    const turn = await generate(contents);

    // No tool call → this is the final answer.
    if (!turn.functionCall) {
      return {
        type: "message",
        content: turn.text?.trim() || FALLBACK_NO_TEXT,
        cars: lastCars,
        searchedQuery: lastQuery,
      };
    }

    const { name, args } = turn.functionCall;

    // ── Questionnaire: exits the loop, hands control back to the buyer. ──
    if (name === QUESTIONNAIRE_TOOL) {
      const v = validateQuestionnaireArgs(args);
      if (v.ok) {
        return { type: "questionnaire", intro: v.value.intro, questions: v.value.questions };
      }
      pushCall(contents, name, args);
      pushResponse(contents, name, { error: v.error });
      continue;
    }

    // ── RAG: retrieve, append result, keep going. ──
    if (name === SEARCH_TOOL) {
      const v = validateSearchArgs(args);
      if (!v.ok) {
        pushCall(contents, name, args);
        pushResponse(contents, name, { error: v.error });
        continue;
      }
      pushCall(contents, name, args);
      try {
        const result = await rag(v.value.query);
        lastCars = result.cars;
        lastQuery = result.query;
        pushResponse(contents, name, {
          query: result.query,
          weak: result.weak,
          note: result.weak
            ? "No strong matches — do not invent cars; ask one clarifying question or widen the search."
            : "Recommend only from these results.",
          cars: result.cars.map(carForModel),
        });
      } catch {
        pushResponse(contents, name, {
          error: "Search failed. Try rephrasing the query or ask the buyer to clarify.",
        });
      }
      continue;
    }

    // ── Unknown tool → fail soft so the model can recover. ──
    pushCall(contents, name, args);
    pushResponse(contents, name, { error: `Unknown tool '${name}'.` });
  }

  // Iteration cap hit — never loop forever (plan §7).
  return { type: "message", content: FALLBACK_CAP, cars: lastCars, searchedQuery: lastQuery };
}
