import {
  GoogleGenerativeAI,
  type Content,
  type EmbedContentRequest,
  type FunctionDeclaration,
} from "@google/generative-ai";
import type { GenerateFn, ModelContent, ModelTurn } from "../types";
import { ENV } from "./env";

/** Raised on any Gemini failure so callers can fail soft (plan §7). */
export class GeminiError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "GeminiError";
  }
}

let _client: GoogleGenerativeAI | null = null;
function client(): GoogleGenerativeAI {
  if (!_client) _client = new GoogleGenerativeAI(ENV.geminiKey());
  return _client;
}

/** HTTP statuses that are worth retrying — transient server/rate-limit errors. */
const RETRYABLE_STATUS = new Set([429, 500, 503]);

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (typeof status === "number") return RETRYABLE_STATUS.has(status);
  // SDK sometimes only embeds the code in the message string.
  const msg = err instanceof Error ? err.message : String(err);
  return /\b(429|500|503)\b/.test(msg);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Run `fn`, retrying transient Gemini failures (503/429/500) with exponential
 * backoff + jitter. Non-transient errors throw immediately. After the final
 * attempt the last error propagates to the caller.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1 || !isRetryable(err)) throw err;
      const backoff = 2 ** i * 500 + Math.random() * 250;
      await sleep(backoff);
    }
  }
  throw lastErr;
}

/** Target embedding dimensionality — kept consistent across every vector. */
export const EMBED_DIM = 768;

/** Embed text with the configured Gemini embedding model → 768-dim vector. */
export async function embed(text: string): Promise<number[]> {
  try {
    const model = client().getGenerativeModel({ model: ENV.embedModel() });
    // `outputDimensionality` is honored by the API but missing from the SDK's
    // 0.21.0 types — cast keeps TS happy without changing runtime behaviour.
    const res = await withRetry(() =>
      model.embedContent({
        content: { role: "user", parts: [{ text }] },
        outputDimensionality: EMBED_DIM,
      } as EmbedContentRequest)
    );
    return res.embedding.values;
  } catch (err) {
    throw new GeminiError("Embedding request failed", err);
  }
}

/**
 * Build a tool-bound generate function for the agent loop. Keeping this as a
 * factory lets the loop stay a pure function of an injected GenerateFn, which
 * is what makes it unit-testable with a fake model (plan §8.1).
 */
export function makeGenerate(
  systemInstruction: string,
  functionDeclarations: FunctionDeclaration[]
): GenerateFn {
  // Try the primary model first, then any distinct fallbacks. Dedupe so a
  // matching override doesn't make us call the same overloaded model twice.
  const modelNames = [...new Set([ENV.chatModel(), ENV.chatFallbackModel()])];

  const callModel = async (
    modelName: string,
    contents: ModelContent[]
  ): Promise<ModelTurn> => {
    const model = client().getGenerativeModel({
      model: modelName,
      systemInstruction,
      tools: [{ functionDeclarations }],
    });
    const result = await withRetry(() =>
      model.generateContent({
        contents: contents as unknown as Content[],
      })
    );
    const response = result.response;
    const calls = response.functionCalls();
    if (calls && calls.length > 0) {
      return {
        functionCall: {
          name: calls[0].name,
          args: (calls[0].args ?? {}) as Record<string, unknown>,
        },
      };
    }
    return { text: response.text() };
  };

  return async (contents: ModelContent[]): Promise<ModelTurn> => {
    let lastErr: unknown;
    for (let i = 0; i < modelNames.length; i++) {
      try {
        return await callModel(modelNames[i], contents);
      } catch (err) {
        lastErr = err;
        // Only fall through to the next model on transient overload; a real
        // error (bad request, bad key) would fail identically everywhere.
        if (i < modelNames.length - 1 && isRetryable(err)) continue;
        break;
      }
    }
    throw new GeminiError("Chat request failed", lastErr);
  };
}
