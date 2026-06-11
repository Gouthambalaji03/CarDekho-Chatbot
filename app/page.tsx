"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import Advisor from "@/components/advisor/Advisor";
import Dataset from "@/components/admin/Dataset";

type Tab = "advisor" | "admin";

export default function Page() {
  const [tab, setTab] = useState<Tab>("advisor");
  // Bumping this key remounts the advisor for a clean "Restart".
  const [advisorKey, setAdvisorKey] = useState(0);

  const restart = () => {
    setTab("advisor");
    setAdvisorKey((k) => k + 1);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F6F4EF",
        color: "#14171C",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopBar tab={tab} onTab={setTab} onRestart={restart} />
      {tab === "advisor" ? <Advisor key={advisorKey} fresh={advisorKey > 0} /> : <Dataset />}
    </div>
  );
}
