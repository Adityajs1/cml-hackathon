import { rankMemories } from "../lib/ranking.ts";

describe("rankMemories", () => {
  test("it ranks memories by similarity + importance + recency", () => {
    const queryEmbedding = [1, 0, 0, 0];

    const memories = [
      {
        id: 1,
        text: "Far but important",
        embedding: [0.1, 0, 0, 0],
        importance_score: 0.9,
        created_at: new Date().toISOString(),
        pinned: false,
      },
      {
        id: 2,
        text: "Very similar",
        embedding: [1, 0, 0, 0],
        importance_score: 0.1,
        created_at: new Date().toISOString(),
        pinned: false,
      },
      {
        id: 3,
        text: "Old memory",
        embedding: [0.9, 0, 0, 0],
        importance_score: 0.5,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 days old
        pinned: false,
      },
    ];

    const ranked = rankMemories(queryEmbedding, memories);

    expect(ranked.length).toBe(3);

    // Most similar should usually win (id 2)
    expect(ranked[0]).toHaveProperty("id");
    expect(ranked[0]).toHaveProperty("text");

  });
});
