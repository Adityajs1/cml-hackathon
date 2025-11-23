// Mock generateText so the classifier doesn't call the network
jest.mock("../lib/gemini.ts", () => ({
  generateText: async () => {
    return `{"importance_score":0.55,"category":"idea","reason":"mocked"}`;
  }
}));

import { classifyImportance } from "../lib/memoryClassifier.ts";


describe("classifyImportance", () => {
  test("returns valid structure with mocked LLM", async () => {
    const res = await classifyImportance("test memory");

    expect(typeof res.importance_score).toBe("number");
    expect(res.importance_score).toBeGreaterThanOrEqual(0);
    expect(res.importance_score).toBeLessThanOrEqual(1);

    expect(typeof res.category).toBe("string");
    expect(typeof res.reason).toBe("string");
  });

  test("fallback mode works for extremely short text", async () => {
    const res = await classifyImportance("hi");

    expect(typeof res.importance_score).toBe("number");
  });
});

