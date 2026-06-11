"use client";

import type { CSSProperties } from "react";
import { BP, useMediaQuery } from "@/lib/useMediaQuery";

type Tab = "advisor" | "admin";

const tabBase: CSSProperties = {
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

export default function TopBar({
  tab,
  onTab,
  onRestart,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  onRestart: () => void;
}) {
  const compact = useMediaQuery(BP.compactBar);

  const tabOn: CSSProperties = {
    ...tabBase,
    padding: compact ? "6px 12px" : "7px 16px",
    fontWeight: 700,
    fontSize: 13.5,
    background: "#fff",
    color: "#0E5C46",
    boxShadow: "0 1px 3px rgba(20,23,28,.1)",
  };
  const tabOff: CSSProperties = {
    ...tabBase,
    padding: compact ? "6px 12px" : "7px 16px",
    fontWeight: 600,
    fontSize: 13.5,
    background: "transparent",
    color: "#6A6F77",
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "rgba(246,244,239,.86)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid #E7E3DA",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: compact ? "0 14px" : "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: compact ? 10 : 18,
        }}
      >
        {/* brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div
            className="font-display"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "#0E5C46",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 18,
              boxShadow: "0 2px 8px rgba(14,92,70,.28)",
              flex: "none",
            }}
          >
            C
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <span
              className="font-display"
              style={{ fontWeight: 700, fontSize: 19, letterSpacing: "-.01em" }}
            >
              CarDekho
            </span>
            {/* badge eats horizontal space — hide it on narrow screens */}
            {!compact && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: "#E8852B",
                  background: "#FBEBD8",
                  padding: "3px 7px",
                  borderRadius: 6,
                }}
              >
                Advisor
              </span>
            )}
          </div>
        </div>

        {/* nav */}
        <nav
          style={{
            display: "flex",
            gap: 4,
            background: "#EDEAE2",
            padding: 4,
            borderRadius: 11,
            marginLeft: compact ? 0 : 8,
            flex: "none",
          }}
        >
          <button onClick={() => onTab("advisor")} style={tab === "advisor" ? tabOn : tabOff}>
            Advisor
          </button>
          <button onClick={() => onTab("admin")} style={tab === "admin" ? tabOn : tabOff}>
            Dataset
          </button>
        </nav>

        {/* right cluster */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 14,
            minWidth: 0,
          }}
        >
          {/* status text is the first thing to drop on small screens */}
          {!compact && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 13,
                color: "#5A6068",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  background: "#0E5C46",
                  animation: "cdPulse 2.4s infinite",
                }}
              />
              <span>Gemini · grounded</span>
            </div>
          )}
          <button
            onClick={onRestart}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#fff",
              border: "1px solid #E2DDD3",
              color: "#3A3F47",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: 13,
              padding: compact ? "8px 11px" : "8px 13px",
              borderRadius: 9,
              cursor: "pointer",
              flex: "none",
              whiteSpace: "nowrap",
            }}
          >
            Restart
          </button>
        </div>
      </div>
    </header>
  );
}
