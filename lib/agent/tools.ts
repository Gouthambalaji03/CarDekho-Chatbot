import { SchemaType, type FunctionDeclaration } from "@google/generative-ai";
import type { QuestionnaireQuestion } from "../types";

export const QUESTIONNAIRE_TOOL = "ask_questionnaire";
export const SEARCH_TOOL = "search_catalogue";

/** Gemini function declarations for the two tools (plan §4). */
export const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: QUESTIONNAIRE_TOOL,
    description:
      "Ask the buyer a short set of questions to understand their needs before recommending. Use only when needs are unclear. Pauses the conversation for the buyer to answer.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        intro: {
          type: SchemaType.STRING,
          description: "One friendly sentence shown above the questions.",
        },
        questions: {
          type: SchemaType.ARRAY,
          description: "3–5 focused questions. Ask only what changes the recommendation.",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING, description: "short key e.g. 'budget'" },
              title: { type: SchemaType.STRING },
              hint: { type: SchemaType.STRING },
              multi: {
                type: SchemaType.BOOLEAN,
                description: "true if multiple options can be selected",
              },
              options: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    label: { type: SchemaType.STRING },
                    value: { type: SchemaType.STRING },
                  },
                  required: ["label", "value"],
                },
              },
            },
            required: ["id", "title", "options"],
          },
        },
      },
      required: ["intro", "questions"],
    },
  },
  {
    name: SEARCH_TOOL,
    description:
      "Semantic search over the live car catalogue. Pass a focused natural-language phrase built from the buyer's needs. Returns the most similar cars with their specs.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: "e.g. 'safe family SUV under 15 lakh petrol automatic'",
        },
      },
      required: ["query"],
    },
  },
];

/** Result of validating tool args — never throws (plan §7, §8.2). */
export type ToolValidation<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function validateSearchArgs(
  args: Record<string, unknown>
): ToolValidation<{ query: string }> {
  const query = args?.query;
  if (typeof query !== "string" || query.trim().length === 0) {
    return { ok: false, error: "Missing or empty 'query' string for search_catalogue." };
  }
  return { ok: true, value: { query: query.trim() } };
}

export function validateQuestionnaireArgs(
  args: Record<string, unknown>
): ToolValidation<{ intro: string; questions: QuestionnaireQuestion[] }> {
  const rawQuestions = args?.questions;
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return { ok: false, error: "ask_questionnaire requires a non-empty 'questions' array." };
  }
  const questions: QuestionnaireQuestion[] = [];
  for (const q of rawQuestions) {
    if (!q || typeof q !== "object") continue;
    const obj = q as Record<string, unknown>;
    const title = typeof obj.title === "string" ? obj.title : "";
    const opts = Array.isArray(obj.options) ? obj.options : [];
    const options = opts
      .map((o) => {
        const oo = (o ?? {}) as Record<string, unknown>;
        const label = typeof oo.label === "string" ? oo.label : "";
        const value = typeof oo.value === "string" ? oo.value : label;
        return { label, value };
      })
      .filter((o) => o.label);
    if (!title || options.length === 0) continue;
    questions.push({
      id: typeof obj.id === "string" && obj.id ? obj.id : title.toLowerCase().replace(/\s+/g, "_"),
      title,
      hint: typeof obj.hint === "string" ? obj.hint : undefined,
      multi: obj.multi === true,
      options,
    });
  }
  if (questions.length === 0) {
    return { ok: false, error: "No valid questions (each needs a title and at least one option)." };
  }
  const intro =
    typeof args?.intro === "string" && (args.intro as string).trim()
      ? (args.intro as string).trim()
      : "A few quick questions so I only point you at cars that actually fit.";
  return { ok: true, value: { intro, questions } };
}
