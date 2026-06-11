"use client";

import type { CSSProperties } from "react";
import type { QuestionnaireQuestion } from "@/lib/types";

const baseChip: CSSProperties = {
  padding: "9px 14px",
  borderRadius: 10,
  border: "1.5px solid #E2DDD3",
  background: "#fff",
  color: "#3A3F47",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "all .12s",
};
const selChip: CSSProperties = {
  ...baseChip,
  border: "1.5px solid #0E5C46",
  background: "#E7F1EC",
  color: "#0E5C46",
};

export type Answers = Record<string, string | string[]>;

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

/** Every question must have an answer (single → a value, multi → ≥1). */
export function answersReady(questions: QuestionnaireQuestion[], a: Answers): boolean {
  return questions.every((q) => {
    const v = a[q.id];
    return q.multi ? Array.isArray(v) && v.length > 0 : typeof v === "string" && v.length > 0;
  });
}

export default function Questionnaire({
  intro,
  questions,
  answers,
  notes,
  submitted,
  onSelect,
  onNotes,
  onSubmit,
}: {
  intro: string;
  questions: QuestionnaireQuestion[];
  answers: Answers;
  notes: string;
  submitted: boolean;
  onSelect: (q: QuestionnaireQuestion, value: string) => void;
  onNotes: (v: string) => void;
  onSubmit: () => void;
}) {
  const ready = answersReady(questions, answers);
  const submitDisabled = !ready || submitted;

  const need = questions
    .filter((q) => {
      const v = answers[q.id];
      return q.multi ? !(Array.isArray(v) && v.length) : !v;
    })
    .map((q) => q.title.toLowerCase());
  const progressText = submitted
    ? "Sent ✓"
    : ready
      ? "Ready when you are"
      : "Pick: " + need.join(", ");

  const submitStyle: CSSProperties = {
    fontFamily: "inherit",
    fontWeight: 700,
    fontSize: 14.5,
    padding: "11px 20px",
    borderRadius: 11,
    border: "none",
    cursor: submitDisabled ? "default" : "pointer",
    background: submitDisabled ? "#E4E0D7" : "#0E5C46",
    color: submitDisabled ? "#A8A296" : "#fff",
    boxShadow: submitDisabled ? "none" : "0 3px 12px rgba(14,92,70,.25)",
  };

  return (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start", animation: "cdFade .4s ease both" }}>
      <AvatarD />
      <div
        style={{
          flex: 1,
          background: "#fff",
          border: "1px solid #EAE6DD",
          borderRadius: "4px 18px 18px 18px",
          boxShadow: "0 4px 22px rgba(20,23,28,.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "13px 20px",
            background: "#F3F6F4",
            borderBottom: "1px solid #E7EEE9",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "#0E5C46",
              background: "#E1EFE9",
              padding: "4px 8px",
              borderRadius: 6,
            }}
          >
            Tool · Questionnaire
          </span>
          <span style={{ fontSize: 13, color: "#5A6068", fontWeight: 500 }}>{intro}</span>
        </div>

        <div style={{ padding: 20 }}>
          {submitted ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#0E5C46",
                fontWeight: 600,
                fontSize: 14,
                padding: "6px 2px",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 99,
                  background: "#E1EFE9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                }}
              >
                ✓
              </span>
              Thanks — sending these over to find your matches.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {questions.map((q) => (
                <div key={q.id}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 11 }}>
                    <span className="font-display" style={{ fontWeight: 700, fontSize: 15, color: "#14171C" }}>
                      {q.title}
                    </span>
                    {q.hint && (
                      <span style={{ fontSize: 12, color: "#9A958B", fontWeight: 500 }}>{q.hint}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                    {q.options.map((o) => {
                      const v = answers[q.id];
                      const selected = q.multi
                        ? Array.isArray(v) && v.includes(o.value)
                        : v === o.value;
                      return (
                        <button
                          key={o.value}
                          onClick={() => onSelect(q, o.value)}
                          style={selected ? selChip : baseChip}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div>
                <div className="font-display" style={{ fontWeight: 700, fontSize: 15, marginBottom: 9 }}>
                  Anything else I should know?{" "}
                  <span style={{ fontSize: 12, color: "#9A958B", fontWeight: 500 }}>optional</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => onNotes(e.target.value)}
                  placeholder="e.g. mostly weekend trips with two kids, prefer something easy to park…"
                  rows={2}
                  style={{
                    width: "100%",
                    border: "1.5px solid #E2DDD3",
                    borderRadius: 11,
                    padding: "11px 13px",
                    fontFamily: "inherit",
                    fontSize: 14,
                    color: "#22262C",
                    resize: "vertical",
                    outline: "none",
                    background: "#FCFBF9",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button onClick={onSubmit} disabled={submitDisabled} style={submitStyle}>
                  Find my matches →
                </button>
                <span style={{ fontSize: 13, color: "#9A958B" }}>{progressText}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
