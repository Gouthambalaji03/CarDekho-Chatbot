"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { SHORTLIST, SUGGESTIONS } from "@/lib/data";
import type { Message, QA } from "@/lib/types";
import Questionnaire from "./Questionnaire";
import Shortlist from "./Shortlist";

type Phase = "welcome" | "thinking" | "asked" | "results";

const emptyQA: QA = {
  budget: "",
  usage: [],
  seating: "",
  fuel: "",
  priorities: [],
  notes: "",
};

const GREETING =
  "Hi, I’m Dia — your car-buying advisor. Tell me a bit about what you need and I’ll narrow 200+ cars down to a shortlist you can actually decide between.\n\nWhat are you shopping for?";

/* ---- small presentational helpers ---- */

const AvatarD = ({ size = 30 }: { size?: number }) => (
  <div
    className="font-display"
    style={{
      flex: "none",
      width: size,
      height: size,
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

function UserBubble({ text }: { text?: string }) {
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

function AgentBubble({ text }: { text?: string }) {
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

function SearchingPill({ m }: { m: Message }) {
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
        {m.active && (
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
        {m.done && (
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
        <span style={{ fontSize: 14, color: "#3A3F47", fontWeight: 500 }}>{m.text}</span>
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
            style={{
              width: 7,
              height: 7,
              borderRadius: 99,
              background: "#9A958B",
              animation: `cdDot 1.2s infinite ${d}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---- main ---- */

export default function Advisor({ fresh = false }: { fresh?: boolean }) {
  const idc = useRef(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const [phase, setPhase] = useState<Phase>("welcome");
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [qa, setQa] = useState<QA>(emptyQA);
  const [qSubmitted, setQSubmitted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, kind: "agent", text: fresh ? "Fresh start! What are you shopping for?" : GREETING },
  ]);

  const nextId = () => idc.current++;
  const after = useCallback((ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  }, []);

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  // keep the conversation pinned to the latest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  /* ---- chat ---- */
  const startFlow = useCallback(
    (text: string) => {
      setMessages((m) => [...m, { id: nextId(), kind: "user", text }]);
      setBusy(true);
      setPhase("thinking");
      after(900, () => {
        setBusy(false);
        setPhase("asked");
        setMessages((m) => [
          ...m,
          {
            id: nextId(),
            kind: "agent",
            text: "Happy to help you get this right. A few quick questions so I only point you at cars that actually fit — then I’ll pull a shortlist.",
          },
          { id: nextId(), kind: "questionnaire" },
        ]);
      });
    },
    [after]
  );

  const freeReply = useCallback(
    (text: string) => {
      setMessages((m) => [...m, { id: nextId(), kind: "user", text }]);
      setBusy(true);
      after(800, () => {
        setBusy(false);
        setMessages((m) => [
          ...m,
          {
            id: nextId(),
            kind: "agent",
            text: "Good point — I’ll factor that in. Want me to re-run the search with that priority weighted higher?",
          },
        ]);
      });
    },
    [after]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    if (phase === "welcome") startFlow(text);
    else freeReply(text);
  }, [input, busy, phase, startFlow, freeReply]);

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ---- questionnaire ---- */
  const selectOpt = (qid: keyof Omit<QA, "notes">, value: string, multi: boolean) => {
    setQa((prev) => {
      if (multi) {
        const arr = (prev[qid] as string[]).slice();
        const i = arr.indexOf(value);
        if (i >= 0) arr.splice(i, 1);
        else arr.push(value);
        return { ...prev, [qid]: arr };
      }
      return { ...prev, [qid]: prev[qid] === value ? "" : value };
    });
  };

  const submitQ = useCallback(() => {
    if (qSubmitted) return;
    const q = qa;
    if (!q.budget || q.usage.length === 0 || !q.fuel) return;
    const parts = [
      "Budget: " + q.budget,
      "Use: " + q.usage.join(", "),
      q.seating ? "Seats: " + q.seating : null,
      "Fuel: " + q.fuel,
      q.priorities.length ? "Priorities: " + q.priorities.join(", ") : null,
      q.notes ? "Notes: " + q.notes : null,
    ].filter(Boolean) as string[];
    const summary = "Here’s what I’m after:\n" + parts.map((p) => "• " + p).join("\n");

    const searchId = nextId();
    setQSubmitted(true);
    setMessages((m) => [
      ...m,
      { id: nextId(), kind: "user", text: summary },
      {
        id: searchId,
        kind: "searching",
        active: true,
        done: false,
        text: "Searching the catalogue for safe, family-friendly cars under ₹15L…",
      },
    ]);

    after(1700, () => {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === searchId
            ? { ...msg, active: false, done: true, text: "Searched the catalogue · 4 strong matches" }
            : msg
        )
      );
      after(550, () => {
        setPhase("results");
        setMessages((m) => [
          ...m,
          {
            id: nextId(),
            kind: "shortlist",
            text: "Here’s your shortlist — four cars that genuinely fit, ranked. Each reason is pulled from what I retrieved, not guessed:",
            cars: SHORTLIST,
          },
        ]);
      });
    });
  }, [qa, qSubmitted, after]);

  const onFollow = (kind: "compare" | "tighter" | "diesel") => {
    if (kind === "compare") freeReply("Compare the Tata Nexon and Hyundai Creta for me.");
    else if (kind === "tighter") freeReply("Can you be stricter and keep everything under ₹14 lakh?");
    else freeReply("What would change if I considered diesel too?");
  };

  /* ---- composer styles ---- */
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
        padding: "0 24px",
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
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            padding: "8px 4px",
            overflowY: "auto",
          }}
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
                    qa={qa}
                    submitted={qSubmitted}
                    onSelect={selectOpt}
                    onNotes={(v) => setQa((p) => ({ ...p, notes: v }))}
                    onSubmit={submitQ}
                  />
                );
              case "searching":
                return <SearchingPill key={m.id} m={m} />;
              case "shortlist":
                return (
                  <Shortlist key={m.id} text={m.text} cars={m.cars ?? []} onFollow={onFollow} />
                );
              default:
                return null;
            }
          })}

          {busy && <TypingDots />}

          {/* welcome suggestions */}
          {phase === "welcome" && (
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
                  onClick={() => {
                    if (phase === "welcome" && !busy) startFlow(s.text);
                  }}
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
