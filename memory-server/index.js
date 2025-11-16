import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CloudClient } from "chromadb";
import { v4 as uuid } from "uuid";

dotenv.config();

const app = express();

// Allow frontend access
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "DELETE"],
  })
);
app.use(express.json());

// --------------------
// Initialize Gemini + Chroma
// --------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chroma = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
});

// =======================================================
// 🧠 ROUTE 1: FETCH ALL MEMORIES (for dashboard)
// =======================================================
app.get("/memories", async (req, res) => {
  try {
    const userId =
      req.query.userId || "32dac220-1244-4335-95c2-86a4da97d1ff";
    const sessionId = req.query.sessionId || "default-session";

    const collection = await chroma.getOrCreateCollection({
      name: `memory_${userId}_${sessionId}`,
    });

    const results = await collection.get();

    const formatted = results.documents.map((doc, i) => ({
      id: results.ids[i],
      document: doc,
      metadata: results.metadatas[i],
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching memories:", err);
    res.status(500).json({ error: "Failed to fetch memories" });
  }
});

// =======================================================
// 💬 ROUTE 2: CHAT WITH MEMORY + LONG-TERM SUMMARIZATION
// =======================================================
app.post("/chat", async (req, res) => {
  try {
    const { userId, message, sessionId, memoryEnabled = true } = req.body;

    if (!userId || !message) {
      return res
        .status(400)
        .json({ error: "Missing required fields (userId, message)" });
    }

    const activeSession = sessionId || "default-session";

    // Memory disabled mode (stateless)
    if (!memoryEnabled) {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const replyRes = await model.generateContent(message);
      return res.json({
        reply: replyRes.response.text(),
        sessionId: activeSession,
      });
    }

    // Create or get collection
    const collection = await chroma.getOrCreateCollection({
      name: `memory_${userId}_${activeSession}`,
      metadata: { version: "v6", sessionId: activeSession },
    });

    // 1️⃣ Embed User Message
    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embedRes = await embedModel.embedContent(message);
    const userVector = embedRes.embedding.values;

    // 2️⃣ Retrieve all existing messages
    const all = await collection.get();
    const docs = all.documents || [];
    const metas = all.metadatas || [];

    // Separate long-term and short-term memories
    const longTerm = metas
      .filter((m) => m?.type === "summary")
      .map((m) => m.summaryText)
      .join("\n");

    const shortTerm = docs.slice(-10).join("\n");

    // 3️⃣ Build Prompt
    const context = `
--- LONG TERM MEMORY ---
${longTerm || "No long-term memory yet."}

--- SHORT TERM MEMORY ---
${shortTerm || "No recent chat memory."}
`;

    const prompt = `
You are Neuron — an AI assistant with layered memory (short-term and long-term).
Use the long-term memory only when relevant to the user's message.

${context}

User: ${message}
AI:
`;

    // 4️⃣ Generate AI Response
    const chatModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
    const replyRes = await chatModel.generateContent(prompt);
    const reply = replyRes.response.text();

    // 5️⃣ Store User Message
    await collection.add({
      ids: [uuid()],
      documents: [message],
      embeddings: [userVector],
      metadatas: [{ role: "user", ts: Date.now(), sessionId: activeSession }],
    });

    // 6️⃣ Store AI Reply
    const embedResAI = await embedModel.embedContent(reply);
    const aiVector = embedResAI.embedding.values;

    await collection.add({
      ids: [uuid()],
      documents: [reply],
      embeddings: [aiVector],
      metadatas: [{ role: "ai", ts: Date.now(), sessionId: activeSession }],
    });

    // 7️⃣ Summarize Older Memory
    if (docs.length > 20) {
      const oldChats = docs.slice(0, -10).join("\n");

      const summarizer = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
      });

      const summaryPrompt = `
Summarize the following chat history into a concise long-term memory summary.
Keep it factual and context-rich.

${oldChats}
      `;

      const summaryRes = await summarizer.generateContent(summaryPrompt);
      const summary = summaryRes.response.text();

      const summaryEmbed = await embedModel.embedContent(summary);

      await collection.add({
        ids: [uuid()],
        documents: [summary],
        embeddings: [summaryEmbed.embedding.values],
        metadatas: [
          {
            role: "system",
            type: "summary",
            summaryText: summary,
            ts: Date.now(),
            sessionId: activeSession,
          },
        ],
      });

      console.log(`🧠 Long-term memory summary added for session: ${activeSession}`);
    }

    // 8️⃣ Return AI Reply
    res.json({ reply, sessionId: activeSession });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server failure" });
  }
});

// =======================================================
// 🗑️ ROUTE 3: DELETE A SPECIFIC MEMORY ENTRY
// =======================================================
app.delete("/memory/:userId/:sessionId/:id", async (req, res) => {
  try {
    const { userId, sessionId, id } = req.params;

    const collection = await chroma.getOrCreateCollection({
      name: `memory_${userId}_${sessionId}`,
    });

    await collection.delete({ ids: [id] });

    console.log(`🗑️ Deleted memory ${id} for user ${userId} (${sessionId})`);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting memory:", err);
    res.status(500).json({ error: "Failed to delete memory" });
  }
});

// =======================================================
// 🧹 ROUTE 4: CLEAR ALL MEMORY FOR A SESSION
// =======================================================
app.delete("/memories/:userId/:sessionId", async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const collection = await chroma.getOrCreateCollection({
      name: `memory_${userId}_${sessionId}`,
    });

    await collection.delete();
    console.log(`🧹 Cleared all memories for ${userId} (${sessionId})`);
    res.json({ success: true });
  } catch (err) {
    console.error("Error clearing memories:", err);
    res.status(500).json({ error: "Failed to clear memories" });
  }
});

// =======================================================
// 📚 ROUTE 5: LIST SESSIONS FOR A USER
// =======================================================
app.get("/sessions", async (req, res) => {
  try {
    const userId = req.query.userId || "32dac220-1244-4335-95c2-86a4da97d1ff";
    const prefix = `memory_${userId}_`;

    const collections = await chroma.listCollections();
    const sessions = collections
      .filter((c) => (c?.name || "").startsWith(prefix))
      .map((c) => c.name.replace(prefix, ""));

    res.json(sessions);
  } catch (err) {
    console.error("Error listing sessions:", err);
    res.status(500).json({ error: "Failed to list sessions" });
  }
});
// 🔎 ROUTE 6: CONTEXT LOOKUP (semantic search)
app.post("/memory/context", async (req, res) => {
  try {
    const { userId, sessionId = "default-session", text, topK = 6 } = req.body;
    if (!text) return res.status(400).json({ error: "Missing 'text'" });

    const collection = await chroma.getOrCreateCollection({
      name: `memory_${userId}_${sessionId}`,
    });

    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const vec = (await embedModel.embedContent(text)).embedding.values;

    const q = await collection.query({
      queryEmbeddings: [vec],
      nResults: topK,
    });

    const docs = (q.documents?.[0] || []).map((doc, i) => ({
      id: q.ids?.[0]?.[i],
      document: doc,
      metadata: q.metadatas?.[0]?.[i],
      distance: q.distances?.[0]?.[i],
    }));

    res.json(docs);
  } catch (err) {
    console.error("Error fetching context:", err);
    res.status(500).json({ error: "Failed to fetch context" });
  }
});

// =======================================================
// ✍️ ROUTE 7: REWRITE A SUMMARY
// =======================================================
app.post("/memory/rewrite", async (req, res) => {
  try {
    const {
      userId,
      sessionId = "default-session",
      id,
      instruction = "Improve clarity and concision. Keep facts.",
    } = req.body;
    if (!id) return res.status(400).json({ error: "Missing 'id'" });

    const collection = await chroma.getOrCreateCollection({
      name: `memory_${userId}_${sessionId}`,
    });

    const got = await collection.get({ ids: [id] });
    const original = got.documents?.[0] || "";
    if (!original) return res.status(404).json({ error: "Summary not found" });

    const editor = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
You are a careful editor of long-term memory summaries.
Instruction: ${instruction}

Original summary:
${original}

Rewrite the summary to follow the instruction while preserving all facts.
`;
    const out = await editor.generateContent(prompt);
    const newText = out.response.text();

    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const emb = (await embedModel.embedContent(newText)).embedding.values;

    const newId = uuid();
    await collection.add({
      ids: [newId],
      documents: [newText],
      embeddings: [emb],
      metadatas: [
        {
          role: "system",
          type: "summary",
          summaryText: newText,
          ts: Date.now(),
          sessionId,
        },
      ],
    });

    await collection.delete({ ids: [id] });

    res.json({ ok: true, id: newId, document: newText });
  } catch (err) {
    console.error("Error rewriting summary:", err);
    res.status(500).json({ error: "Failed to rewrite summary" });
  }
});

// =======================================================
// 🚀 SERVER START
// =======================================================
app.listen(5050, () => {
  console.log("🚀 Memory Server running at http://localhost:5050");
});
