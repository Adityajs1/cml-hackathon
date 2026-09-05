export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is missing in environment variables.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedText?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }
  );

  const json = await response.json();
  const embedding = json.embedding?.value;

  if (!embedding) {
    console.error("Embedding error response:", json);
    throw new Error("Failed to generate embedding");
  }

  return embedding;
}
