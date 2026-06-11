import { NextResponse } from "next/server";
import type { ChatMessage } from "@/lib/types";
import { runAgent } from "@/lib/agent/loop";
import { SYSTEM_PROMPT } from "@/lib/agent/systemPrompt";
import { FUNCTION_DECLARATIONS } from "@/lib/agent/tools";
import { makeGenerate } from "@/lib/server/gemini";
import { ragSearch } from "@/lib/server/rag";

export const runtime = "nodejs";

const FRIENDLY_ERROR =
  "I'm having trouble reaching the model right now — please try again in a moment.";

export async function POST(req: Request) {
  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Fail soft on any model/db error — never 500 (plan §7).
  try {
    const generate = makeGenerate(SYSTEM_PROMPT, FUNCTION_DECLARATIONS);
    const result = await runAgent(messages, { generate, rag: ragSearch });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/chat] agent error:", err);
    return NextResponse.json({ type: "message", content: FRIENDLY_ERROR, cars: [] });
  }
}
