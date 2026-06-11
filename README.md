# CarDekho Advisor — agentic car-buying advisor

An agentic chatbot that takes an Indian-market car buyer from *"I don't know what to buy"* to a confident, **grounded** shortlist of 3–5 real cars — each with a one-line reason pulled from a live catalogue, never invented.

Meet **Dia**: she asks only the few questions that change the recommendation, runs a semantic search over the catalogue, and converges on a ranked shortlist.

---

## What's built

**Frontend** (faithful build of the Claude Design handoff)
- **Advisor chat** — welcome chips, free typing, the `Dia` persona, typing/searching states
- **Questionnaire tool** rendered inline as an interactive card (questions come from the LLM)
- **RAG step** — a "Searched the catalogue · N matches" pill (tagged `RAG`)
- **Ranked shortlist** — cards with match bars, a "Top pick" badge, a grounded *Why* per car, and a "nothing invented" footnote
- **Dataset / admin** — create form + live catalogue grid with "just embedded · searchable now" feedback

**Backend** (per the project plan)
- `POST /api/chat` — the **agent loop**: full conversation history, two tools, a max-iteration cap, fail-soft on every model/DB error
- `GET/POST /api/cars` — list the catalogue / create a car through the **single create handler**
- **Two tools:** `ask_questionnaire` (gathers needs, exits the loop and hands control back) and `search_catalogue` (RAG)
- **RAG:** embed the query with `text-embedding-004` → rank stored car embeddings via **in-memory cosine similarity** (no vector index) → top-k
- **One create path:** build text summary → embed → write to MongoDB. The seed script reuses it, so every embedding is produced identically and any new car is immediately retrievable.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Agent LLM | Gemini `gemini-2.5-flash` (override via `GEMINI_CHAT_MODEL`) |
| Embeddings | Gemini `gemini-embedding-001` @ 768-dim |
| Database | MongoDB Atlas (records + embeddings as plain arrays) |
| RAG | In-memory cosine similarity — a pure, unit-testable function |
| Tests | Vitest (Gemini + Mongo mocked) |

**Why in-memory cosine?** For a small curated catalogue it returns matches in milliseconds, removes the most fragile infra (a vector index), and keeps the ranking logic a pure function we can unit-test offline.

---

## Run it

```bash
npm install
cp .env.example .env.local      # then fill in the two keys
npm run seed                    # embeds ~12 cars into MongoDB (idempotent)
npm run dev                     # http://localhost:3000
```

Required env (`.env.local`):

```
GEMINI_API_KEY=...              # https://aistudio.google.com/apikey
MONGODB_URI=...                 # MongoDB Atlas connection string
```

Without these, the app still runs: the **Dataset** page falls back to sample data and the chat returns a friendly "having trouble reaching the model" message — it never crashes.

## Test

```bash
npm test
```

Five focused suites (plan §8), all offline with Gemini/Mongo mocked:
1. **Agent loop** — dispatches the right tool, stops at the max-iteration cap, questionnaire exits the loop, fails soft on bad args, passes the weak-result signal through.
2. **Tool-arg validation** — malformed/missing args produce a clean error instead of throwing.
3. **Summary builder** — a car record maps to the expected embedding text.
4. **Cosine ranking** — correct similarity order + respects top-k (pure function).
5. **RAG result handling** — empty/weak results flag the "ask a clarifying question" path, never a hallucinated car.

---

## How the questionnaire round-trip works

1. When needs are unclear, the model calls `ask_questionnaire`; the loop **exits** and returns the questions.
2. The frontend renders them as a form. On submit it sends the answers back as a normal user message.
3. The model now has the answers → calls `search_catalogue` → recommends **only** cars in the results.

## Failure handling (fail soft, never crash or hallucinate)

- Weak/empty RAG → the model is told not to invent cars and to ask one clarifying question.
- Malformed tool args → a clean error result the model can recover from (loop never throws).
- Max-iteration cap → the loop can never spin forever.
- Every Gemini/Mongo call is wrapped; transient errors return a friendly message, never a 500.

## Project layout

```
app/
  page.tsx                 # tab shell (Advisor / Dataset)
  api/chat/route.ts        # agent loop endpoint
  api/cars/route.ts        # list + create
components/                # TopBar, advisor/*, admin/*  (the design)
lib/
  summary.ts               # buildSummary  (pure)
  cosine.ts                # cosineSimilarity + rankTopK  (pure)
  agent/{systemPrompt,tools,loop}.ts
  server/{env,db,gemini,cars,rag}.ts
scripts/seed.ts            # reuses createCar
tests/                     # the five Vitest suites
```

## What was cut / deferred

- **Edit & delete** in the admin CRUD (the buyer never sees the admin page) — create + view only.
- **Atlas Vector Search** — deliberately not used; in-memory cosine is simpler and testable.
- Multi-angle RAG (multiple search phrases per turn) is supported by the loop but not aggressively prompted.

## With 4 more hours

- Real car images via image slots on the shortlist cards.
- A side-by-side **compare** view for "Compare your top two".
- Stream the agent's final answer token-by-token instead of a single response.
- A small eval harness scoring shortlist groundedness against the retrieved set.
