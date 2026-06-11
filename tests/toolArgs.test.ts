import { describe, it, expect } from "vitest";
import {
  validateQuestionnaireArgs,
  validateSearchArgs,
} from "@/lib/agent/tools";

describe("tool-arg validation / fail-soft (plan §8.2)", () => {
  it("search: accepts a valid query, trimming whitespace", () => {
    const v = validateSearchArgs({ query: "  safe family SUV  " });
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.value.query).toBe("safe family SUV");
  });

  it("search: returns a clean error (never throws) for missing/empty query", () => {
    expect(() => validateSearchArgs({})).not.toThrow();
    expect(validateSearchArgs({}).ok).toBe(false);
    expect(validateSearchArgs({ query: "   " }).ok).toBe(false);
    expect(validateSearchArgs({ query: 42 as unknown as string }).ok).toBe(false);
  });

  it("questionnaire: parses valid questions and defaults the intro", () => {
    const v = validateQuestionnaireArgs({
      questions: [
        { id: "budget", title: "Budget", options: [{ label: "Under ₹8L", value: "u8" }] },
      ],
    });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.value.questions).toHaveLength(1);
      expect(v.value.questions[0].id).toBe("budget");
      expect(v.value.intro.length).toBeGreaterThan(0);
    }
  });

  it("questionnaire: returns a clean error for malformed args", () => {
    expect(() => validateQuestionnaireArgs({})).not.toThrow();
    expect(validateQuestionnaireArgs({}).ok).toBe(false);
    expect(validateQuestionnaireArgs({ questions: [] }).ok).toBe(false);
    // questions present but each lacks options/title → no valid questions
    expect(validateQuestionnaireArgs({ questions: [{ id: "x" }] }).ok).toBe(false);
  });
});
