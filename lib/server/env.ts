/** Centralised env access with friendly errors. Server-only. */

export const ENV = {
  geminiKey: () => required("GEMINI_API_KEY"),
  mongoUri: () => required("MONGODB_URI"),
  mongoDb: () => process.env.MONGODB_DB || "cardekho",
  chatModel: () => process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash",
  // Used when the primary chat model is overloaded (503). Less-congested model.
  chatFallbackModel: () =>
    process.env.GEMINI_CHAT_FALLBACK_MODEL || "gemini-2.5-flash-lite",
  embedModel: () => process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001",
};

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env.local and fill it in.`
    );
  }
  return v;
}
