# Project Plan — CarDekho Agentic Car-Buying Advisor

## 1. The Brief

**Problem:** Buyers arrive confused. Too many options, no clear way to figure out which car fits them.

**Goal:** Build a web app that takes a buyer from *"I don't know what to buy"* → *"I'm confident about my shortlist."*

**Solution:** An agentic chatbot with tools that helps a customer in the Indian market identify cars that fit their needs, converging on a ranked shortlist of 3–5 real cars, each with a grounded one-line reason.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router)** | One full-stack unit: chat UI (frontend) + API routes (backend) |
| Language | **TypeScript** | Throughout |
| Agent LLM | **Gemini**, pinned (`gemini-2.0-flash`) | Reproducible builds |
| Embeddings | **Gemini `text-embedding-004`** | 768 dims |
| Database | **MongoDB Atlas** | Car records + stored embeddings |
| RAG retrieval | **In-memory cosine similarity** | NO Atlas Vector Search index — pure function, unit-testable offline |
| Deploy | **Vercel** | Single deployment, pre-seeded so first click works |
| Tests | **Vitest** | Ships cleanly with the stack |

**Design rationale:** For a small curated dataset, in-memory cosine similarity returns matches in milliseconds, removes the most fragile infra setup (vector index), and keeps the run/deploy story to a single Vercel deployment.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Next.js App (Vercel)                                    │
│                                                          │
│  Frontend (Chat UI)          Backend (API Routes)        │
│  ┌──────────────────┐        ┌────────────────────────┐  │
│  │ Chat window      │ ──────►│ /api/chat (agent loop) │  │
│  │ Questionnaire    │        │   ├─ system prompt     │  │
│  │   form renderer  │◄────── │   ├─ tool dispatch     │  │
│  └──────────────────┘        │   │   ├─ questionnaire │  │
│  ┌──────────────────┐        │   │   └─ RAG           │  │
│  │ Admin/Dataset    │ ──────►│ /api/cars (CRUD)       │  │
│  │   CRUD page      │        │   └─ create handler ───┼──┐
│  └──────────────────┘        └────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                                                           │
         ┌─────────────────┐      ┌──────────────────┐     │
         │ Gemini API      │      │ MongoDB Atlas    │◄────┘
         │  chat + embed   │      │  cars+embeddings │
         └─────────────────┘      └──────────────────┘
```

---

## 4. The Two Tools

### Tool 1 — Questionnaire
- **Purpose:** LLM gathers the buyer's needs, preferences, and budget to narrow options.
- **Flow:**
  1. LLM calls the questionnaire tool with the questions as tool args (multiple-choice + open-ended covering lifestyle, driving habits, desired features).
  2. Tool handler inserts a tool result ("questions have been asked") and **exits the agent loop**, marking the turn complete.
  3. Frontend: if the last message is a questionnaire tool result, render the questionnaire **form**.
  4. On submit, frontend sends a user message containing the Q&A as content back to the backend.
  5. LLM uses these answers to drive recommendations.
- **Principle:** Ask only the few questions that actually change the recommendation — not a long survey.

### Tool 2 — RAG (Retrieval-Augmented Generation)
- **Purpose:** Semantic search over car records (specs, features, prices, reviews).
- **Flow:**
  1. Called with a search phrase built from the buyer's needs (may be called multiple times for different angles).
  2. Embed the phrase with `text-embedding-004`.
  3. Rank against stored car embeddings via **in-memory cosine similarity** (load embeddings once, compute top-k).
  4. Return top-k cars; LLM grounds its response **only** in these results.
- **Principle:** Pure ranking function — unit-testable offline, no vector index.

---

## 5. Data Layer (Indian market — CarDekho)

**Car record fields:**
- make, model, variant
- price (₹ lakh)
- body type, fuel type, transmission
- mileage (kmpl)
- safety rating
- list of key features
- one or two short user-review snippets
- **embedding vector** (768-dim, from a text summary of all the above) stored as a plain number array

**Create path (single source of truth):**
- Admin/dataset page → reusable **create handler**.
- On create, backend: (1) builds the text summary, (2) generates the embedding, (3) writes record + embedding to MongoDB — all in one step. Any new car is immediately RAG-retrievable.
- **Seed script** reuses the *same* create handler in a loop to load ~10–15 cars. Run once against production DB before sharing the link. No duplicated embedding logic.
- **Invariant:** all embeddings produced by the same model so cosine comparison stays valid.

**CRUD scope:** Create + view are required. Edit + delete are **stretch goals — cut first if time is tight** (the buyer never sees the admin page).

---

## 6. Agent Loop & Conversation

- Agent operates over the **full conversation history** — running array of user/assistant/tool messages passed in every turn (includes the last questionnaire tool result).
- Plain message array; **no auth / user account** binding.
- **Max-iteration cap** so it can never loop forever on repeated tool calls.
- Questionnaire tool call exits the loop and returns control to the user.

### System Prompt (the agent's brain)
- **Role:** Friendly, no-nonsense car-buying advisor for CarDekho (Indian market). Takes confused buyers to a confident shortlist.
- **Goal:** End every advisory conversation with a ranked shortlist of 3–5 real cars, each with a clear reason.
- **Intended flow:**
  1. If needs unknown (budget, family size/usage, city vs highway, fuel pref, must-have features) → call **questionnaire** first; ask only what changes the recommendation.
  2. Once answers are in → call **RAG** with focused phrases (e.g. "safe family SUV under 15 lakh", "high mileage petrol hatchback"); may call multiple times.
  3. Recommend only cars present in RAG results → converge on ranked shortlist with one grounded reason per car.
- **Tool-use rules:** Prefer questionnaire before recommending when needs unclear; never invent cars/specs not in RAG results; if results weak, say so and ask one clarifying question.
- **Tone:** Concise, plain language, one focused ask at a time.

### Final Artifact (success criterion)
A short, ranked shortlist (3–5 cars), each with a one-line reason grounded in retrieved data + stated needs — e.g. *"recommended because: 5-star safety, fits your ₹X budget, best-in-class mileage for your highway commute."*

---

## 7. Failure / Edge-Case Handling (fail soft, never crash or hallucinate)

- **No/weak RAG matches:** Say so plainly and ask one clarifying question (or widen the search) — never invent cars.
- **No hallucination:** Only recommend cars that actually appear in retrieved RAG results.
- **Malformed/missing tool args:** Tool handler returns a clear error result the LLM can recover from — never throws/breaks the loop.
- **Loop cap:** Max-iteration cap enforced.
- **Gemini calls (chat + embedding):** Wrapped in try/catch. On rate-limit/timeout/API error, return a friendly *"I'm having trouble reaching the model right now, please try again"* — never 500. (Evaluator runs on the dev's API key; transient quota errors must fail soft.)

---

## 8. Test Suite (Vitest — fast, focused, offline; Gemini + MongoDB mocked)

1. **Agent loop:** dispatches the right tool for a given tool call; stops at the max-iteration cap; questionnaire tool exits the loop and returns control.
2. **Tool-arg validation / fail-soft:** malformed/missing args produce a clean error result instead of throwing.
3. **Embedding text-summary builder:** a car record maps to the expected summary string.
4. **Cosine-similarity ranking:** given a query vector + a few car vectors, returns correct similarity order and respects top-k (pure function, no mocks).
5. **RAG result handling:** empty/weak results take the "no good match, ask a clarifying question" path, not a hallucinated car.

Keep to this handful — enough to show core logic is correct, not exhaustive coverage.

---

## 9. Repo Scaffolding (GitHub deliverable)

- **README:** what was built, why, what was cut, tech stack, "what I'd do with 4 more hours."
- **.env.example:** required keys — Gemini API key, MongoDB Atlas connection URI (no vector index name needed).
- **Seed command:** one-line command to run the seed script, documented in README.

---

## 10. Build Order

**Guiding principle:** get a runnable, human-interactable app end-to-end as early as
possible, then deepen it. Never spend the whole window on headless infrastructure — a
working vertical slice is demoable, satisfies "frontend a human can interact with," and
gives the screen recording something real to show. Tests come *after* the slice works, so
they stay the "fast, not ceremonial" bonus rather than blocking a working demo.

### Phase A — Thin end-to-end slice (always have something that runs)
1. **Scaffold** Next.js (App Router) + TypeScript project; `.env.example`.
2. **Data model + create handler** (summary builder → embedding → Mongo write) and a
   **seed script** reusing it — get a handful of real cars into the DB immediately.
3. **Cosine similarity + RAG retrieval** (pure functions) — just working, not yet tested.
4. **Agent loop + system prompt + minimal chat UI**, wired together. ← *first demoable point:*
   the buyer can type, the agent can call RAG and reply. Keep the UI thin.

### Phase B — Complete the product
5. **Questionnaire tool** (the exit-loop behavior) + **form renderer** in the chat UI.
6. **Admin CRUD page** (create + view) wired to the create handler.
7. **Edge-case hardening** (try/catch on Gemini calls, weak-match → clarifying-question path,
   max-iteration cap, malformed-arg fail-soft).

### Phase C — Bonus & ship
8. **Tests** (the five in §8) — now that the slice works, add them in one focused pass.
9. **README + final polish**; deploy to Vercel, seed prod DB, **verify the first click works**.

### Cut order if time is tight
1. Tests (§8) — bonus only; cut before any Phase A/B feature.
2. Edit + delete in CRUD (buyer never sees the admin page).
3. Extra RAG-angle calls / multi-query polish.
4. Admin CRUD page entirely (seed script alone can populate the DB).