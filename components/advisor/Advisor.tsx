"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { SUGGESTIONS } from "@/lib/data";
import { postChat } from "@/lib/client";
import { BP, useMediaQuery } from "@/lib/useMediaQuery";
import type {
  ChatMessage,
  QuestionnaireQuestion,
  RagCar,
  ShortlistCar,
} from "@/lib/types";
import Questionnaire, { answersReady, type Answers } from "./Questionnaire";
import Shortlist from "./Shortlist";

const GREETING =
  "Hi, I’m Dia — your car-buying advisor. Tell me a bit about what you need and I’ll narrow 200+ cars down to a shortlist you can actually decide between.\n\nWhat are you shopping for?";

const FOLLOW_UP_TEXT: Record<"compare" | "tighter" | "diesel", string> = {
  compare: "Compare your top two picks for me.",
  tighter: "Can you be stricter and keep everything under ₹14 lakh?",
  diesel: "What would change if I considered diesel too?",
};

type UIMessage =
  | { id: number; kind: "user" | "agent"; text: string }
  | { id: number; kind: "questionnaire"; intro: string; questions: QuestionnaireQuestion[] }
  | { id: number; kind: "searching"; text: string; done: boolean }
  | { id: number; kind: "shortlist"; text: string; cars: ShortlistCar[] };

/* ---- presentational helpers ---- */

const AvatarD = () => (
  <div
    className="font-display"
    style={{
      flex: "none",
      width: 30,
      height: 30,
      borderRadius: 9,
      background: "linear-gradient(150deg,#0E5C46,#16785C)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontWeight: 800,
      fontSize: 14,
      marginTop: 2,
    }}
  >
    D
  </div>
);

function UserBubble({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", animation: "cdFade .35s ease both" }}>
      <div
        style={{
          maxWidth: "78%",
          background: "#0E5C46",
          color: "#fff",
          padding: "12px 16px",
          borderRadius: "16px 16px 4px 16px",
          fontSize: 15,
          lineHeight: 1.5,
          boxShadow: "0 2px 10px rgba(14,92,70,.18)",
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function AgentBubble({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start", animation: "cdFade .35s ease both" }}>
      <AvatarD />
      <div
        style={{
          maxWidth: "84%",
          background: "#fff",
          border: "1px solid #EAE6DD",
          padding: "13px 17px",
          borderRadius: "4px 16px 16px 16px",
          fontSize: 15,
          lineHeight: 1.58,
          color: "#22262C",
          boxShadow: "0 1px 3px rgba(20,23,28,.04)",
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function SearchingPill({ text, done }: { text: string; done: boolean }) {
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start", animation: "cdFade .35s ease both" }}>
      <AvatarD />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          background: "#fff",
          border: "1px solid #EAE6DD",
          padding: "11px 16px",
          borderRadius: "4px 14px 14px 14px",
        }}
      >
        {!done && (
          <span
            style={{
              width: 16,
              height: 16,
              border: "2.5px solid #D8E5DF",
              borderTopColor: "#0E5C46",
              borderRadius: 99,
              animation: "cdSpin .7s linear infinite",
              display: "inline-block",
            }}
          />
        )}
        {done && (
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: 99,
              background: "#E1EFE9",
              color: "#0E5C46",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            ✓
          </span>
        )}
        <span style={{ fontSize: 14, color: "#3A3F47", fontWeight: 500 }}>{text}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: "#0E5C46",
            background: "#E1EFE9",
            padding: "3px 7px",
            borderRadius: 6,
          }}
        >
          RAG
        </span>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "center", animation: "cdFade .25s ease both" }}>
      <div
        className="font-display"
        style={{
          flex: "none",
          width: 30,
          height: 30,
          borderRadius: 9,
          background: "linear-gradient(150deg,#0E5C46,#16785C)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 800,
          fontSize: 14,
        }}
      >
        D
      </div>
      <div
        style={{
          display: "flex",
          gap: 5,
          background: "#fff",
          border: "1px solid #EAE6DD",
          padding: "14px 16px",
          borderRadius: "4px 14px 14px 14px",
        }}
      >
        {[0, 0.15, 0.3].map((d, i) => (
          <span
            key={i}
            style={{ width: 7, height: 7, borderRadius: 99, background: "#9A958B", animation: `cdDot 1.2s infinite ${d}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Map RAG-retrieved cars to the shortlist card view. Reasons stay grounded. */
function toShortlistCars(cars: RagCar[]): ShortlistCar[] {
  return cars.map((c, i) => ({
    make: c.make,
    model: c.model,
    variant: c.variant,
    price: c.price,
    mileage: c.mileage,
    fuel: c.fuel,
    safety: c.safety,
    rank: i + 1,
    match: Math.round(c.score * 100),
    reason:
      c.review ||
      `${c.safety}★ safety, ₹${c.price}L${c.fuel ? `, ${c.fuel}` : ""}, ${c.mileage} kmpl.`,
  }));
}

/* ---- main ---- */

export default function Advisor({ fresh = false }: { fresh?: boolean }) {
  const mobile = useMediaQuery(BP.mobile);
  const idc = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const greeting = fresh ? "Fresh start! What are you shopping for?" : GREETING;

  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([
    { id: 0, kind: "agent", text: greeting },
  ]);
  // The conversation sent to the backend (text turns only).
  const convo = useRef<ChatMessage[]>([{ role: "assistant", content: greeting }]);

  // Active questionnaire answer state (one at a time).
  const [qAnswers, setQAnswers] = useState<Answers>({});
  const [qNotes, setQNotes] = useState("");
  const [qSubmitted, setQSubmitted] = useState(false);
  const [qActive, setQActive] = useState<QuestionnaireQuestion[] | null>(null);

  const nextId = () => idc.current++;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const pushUI = (m: UIMessage) => setMessages((prev) => [...prev, m]);

  const handleResult = useCallback(
    (result: Awaited<ReturnType<typeof postChat>>) => {
      if (result.type === "questionnaire") {
        // Record the ask as an assistant turn so the model knows it asked.
        convo.current.push({ role: "assistant", content: result.intro });
        setQActive(result.questions);
        setQAnswers({});
        setQNotes("");
        setQSubmitted(false);
        pushUI({
          id: nextId(),
          kind: "questionnaire",
          intro: result.intro,
          questions: result.questions,
        });
        return;
      }
      // message
      convo.current.push({ role: "assistant", content: result.content });
      if (result.cars && result.cars.length > 0) {
        pushUI({
          id: nextId(),
          kind: "searching",
          done: true,
          text: `Searched the catalogue · ${result.cars.length} strong ${
            result.cars.length === 1 ? "match" : "matches"
          }`,
        });
        pushUI({
          id: nextId(),
          kind: "shortlist",
          text: result.content,
          cars: toShortlistCars(result.cars),
        });
      } else {
        pushUI({ id: nextId(), kind: "agent", text: result.content });
      }
    },
    []
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setStarted(true);
      pushUI({ id: nextId(), kind: "user", text: trimmed });
      convo.current.push({ role: "user", content: trimmed });
      setBusy(true);
      try {
        const result = await postChat(convo.current);
        handleResult(result);
      } finally {
        setBusy(false);
      }
    },
    [busy, handleResult]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    void send(text);
  }, [input, busy, send]);

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ---- questionnaire ---- */
  const selectOpt = (q: QuestionnaireQuestion, value: string) => {
    setQAnswers((prev) => {
      if (q.multi) {
        const arr = Array.isArray(prev[q.id]) ? [...(prev[q.id] as string[])] : [];
        const i = arr.indexOf(value);
        if (i >= 0) arr.splice(i, 1);
        else arr.push(value);
        return { ...prev, [q.id]: arr };
      }
      return { ...prev, [q.id]: prev[q.id] === value ? "" : value };
    });
  };

  const submitQuestionnaire = useCallback(async () => {
    if (!qActive || qSubmitted || !answersReady(qActive, qAnswers) || busy) return;
    const lines = qActive.map((q) => {
      const v = qAnswers[q.id];
      const labelFor = (val: string) =>
        q.options.find((o) => o.value === val)?.label ?? val;
      const ans = q.multi
        ? (v as string[]).map(labelFor).join(", ")
        : labelFor(v as string);
      return `${q.title}: ${ans}`;
    });
    if (qNotes.trim()) lines.push(`Notes: ${qNotes.trim()}`);
    const summary = "Here’s what I’m after:\n" + lines.map((l) => "• " + l).join("\n");

    setQSubmitted(true);
    pushUI({ id: nextId(), kind: "user", text: summary });
    convo.current.push({ role: "user", content: summary });
    setBusy(true);
    try {
      const result = await postChat(convo.current);
      handleResult(result);
    } finally {
      setBusy(false);
    }
  }, [qActive, qSubmitted, qAnswers, qNotes, busy, handleResult]);

  /* ---- composer ---- */
  const canSend = input.trim().length > 0 && !busy;
  const sendStyle: CSSProperties = {
    flex: "none",
    width: 40,
    height: 40,
    borderRadius: 11,
    border: "none",
    cursor: canSend ? "pointer" : "default",
    fontSize: 19,
    fontWeight: 700,
    background: canSend ? "#0E5C46" : "#E4E0D7",
    color: canSend ? "#fff" : "#B0AA9E",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all .12s",
  };

  return (
    <main
      style={{
        flex: 1,
        width: "100%",
        maxWidth: 1120,
        margin: "0 auto",
        padding: mobile ? "0 12px" : "0 24px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          display: "flex",
          flexDirection: "column",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {/* advisor identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "22px 4px 14px" }}>
          <div
            className="font-display"
            style={{
              position: "relative",
              width: 44,
              height: 44,
              borderRadius: 13,
              background: "linear-gradient(150deg,#0E5C46,#16785C)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            D
            <span
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 13,
                height: 13,
                borderRadius: 99,
                background: "#3BB273",
                border: "2.5px solid #F6F4EF",
              }}
            />
          </div>
          <div>
            <div className="font-display" style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.1 }}>
              Dia
            </div>
            <div style={{ fontSize: 13, color: "#5A6068", fontWeight: 500 }}>
              Your car-buying advisor · always grounded in the live catalogue
            </div>
          </div>
        </div>

        {/* messages */}
        <div
          ref={scrollRef}
          className="cd-scroll"
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18, padding: "8px 4px", overflowY: "auto" }}
        >
          {messages.map((m) => {
            switch (m.kind) {
              case "user":
                return <UserBubble key={m.id} text={m.text} />;
              case "agent":
                return <AgentBubble key={m.id} text={m.text} />;
              case "questionnaire":
                return (
                  <Questionnaire
                    key={m.id}
                    intro={m.intro}
                    questions={m.questions}
                    answers={qActive === m.questions ? qAnswers : {}}
                    notes={qActive === m.questions ? qNotes : ""}
                    submitted={qActive === m.questions ? qSubmitted : true}
                    onSelect={selectOpt}
                    onNotes={setQNotes}
                    onSubmit={submitQuestionnaire}
                  />
                );
              case "searching":
                return <SearchingPill key={m.id} text={m.text} done={m.done} />;
              case "shortlist":
                return (
                  <Shortlist
                    key={m.id}
                    text={m.text}
                    cars={m.cars}
                    onFollow={(kind) => send(FOLLOW_UP_TEXT[kind])}
                  />
                );
              default:
                return null;
            }
          })}

          {busy && <TypingDots />}

          {/* welcome suggestions */}
          {!started && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 9,
                margin: "2px 0 6px 41px",
                animation: "cdFade .4s ease both",
              }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => !busy && send(s.text)}
                  style={{
                    background: "#fff",
                    border: "1px solid #E2DDD3",
                    color: "#22262C",
                    fontFamily: "inherit",
                    fontWeight: 600,
                    fontSize: 13.5,
                    padding: "9px 14px",
                    borderRadius: 99,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <span style={{ color: "#E8852B" }}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* composer */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            padding: "14px 0 22px",
            background: "linear-gradient(180deg,rgba(246,244,239,0),#F6F4EF 38%)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 9,
              background: "#fff",
              border: "1px solid #E2DDD3",
              borderRadius: 16,
              padding: "8px 8px 8px 16px",
              boxShadow: "0 6px 24px rgba(20,23,28,.07)",
            }}
          >
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
              onKeyDown={onKey}
              placeholder="Tell Dia what you're looking for…"
              rows={1}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                resize: "none",
                fontFamily: "inherit",
                fontSize: 15,
                lineHeight: 1.5,
                color: "#22262C",
                background: "transparent",
                padding: "8px 0",
                maxHeight: 120,
              }}
            />
            <button onClick={handleSend} disabled={!canSend} style={sendStyle}>
              ↑
            </button>
          </div>
          <div style={{ textAlign: "center", fontSize: 11.5, color: "#A8A296", marginTop: 9 }}>
            Dia only recommends cars it actually retrieves — it won't make any up.
          </div>
        </div>
      </div>
    </main>
  );
}
