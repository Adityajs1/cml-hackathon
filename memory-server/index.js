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
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "");
const chroma = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE
});

async function getProfileCollection(userId) {
  return await chroma.getOrCreateCollection({
    name: `memory_${userId}_profile`,
    metadata: { type: "profile" }
  });
}

// =======================================================
// 🧠 ROUTE 1: FETCH ALL MEMORIES (for dashboard)
// =======================================================
// GET /memories/heatmap?userId=<>&sessionId=<>&weeks=12
app.get("/memories/heatmap", async (req, res) => {
  try {
    const userId = req.query.userId || "32dac220-1244-4335-95c2-86a4da97d1ff";
    const sessionId = req.query.sessionId || "default-session";
    const weeks = parseInt(req.query.weeks || "12", 10);

    const collection = await chroma.getOrCreateCollection({
      name: `memory_${userId}_${sessionId}`
    });

    // get all records (IDs, docs, metadatas)
    const results = await collection.get();

    const metadatas = results.metadatas || [];

    // collect timestamps into dates (UTC) -> counts
    const counts = {}; // { "2025-11-01": 3, ... }

    metadatas.forEach((meta) => {
      if (!meta) return;
      // expect meta.ts (ms)
      const ts = meta.ts || meta?.timestamp || meta?.time;
      if (!ts) return;
      const d = new Date(Number(ts));
      if (isNaN(d.getTime())) return;
      // convert to YYYY-MM-DD in UTC
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    // build list of dates covering `weeks` weeks up to today (inclusive)
    const days = weeks * 7;
    const today = new Date();
    // use UTC midnight for all dates to avoid timezone inconsistencies
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const output = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(todayUTC);
      d.setUTCDate(d.getUTCDate() - i);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;
      output.push({ date: key, count: counts[key] || 0 });
    }

    res.json({ weeks, data: output }); // data: array ordered oldest -> newest
  } catch (err) {
    console.error("Heatmap error:", err);
    res.status(500).json({ error: "Failed to compute heatmap" });
  }
});
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
    const { userId, message, sessionId, sessionTitle, memoryEnabled = true } = req.body;

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
      metadata: { version: "v6", sessionId: activeSession, title: sessionTitle || `Chat with ${userId}` },
    });

    // 1️⃣ Embed User Message
    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embedRes = await embedModel.embedContent(message);
    const userVector = embedRes.embedding.values;

    // 2️⃣ Retrieve session memory
    const sessionAll = await collection.get();

    const sessionDocs = sessionAll.documents || [];
    const sessionMetas = sessionAll.metadatas || [];

    // 3️⃣ Retrieve global profile memory
    const profileCollection = await getProfileCollection(userId);
    const profileAll = await profileCollection.get();

    const profileDocs = profileAll.documents || [];
    const profileMetas = profileAll.metadatas || [];

    // Separate long-term and short-term memories
    const sessionLong = sessionMetas
      .filter((m) => m?.type === "summary")
      .map((m) => m.summaryText)
      .join("\n");

    const shortTerm = sessionDocs.slice(-10).join("\n");

    const profileLong = profileMetas
      .filter((m) => m?.type === "profile")
      .map((m) => m.text) // Assuming profile memories store text directly
      .join("\n");

    // 3️⃣ Build Prompt
    const prompt = `
You are Neuron — an AI assistant with layered memory:
- Permanent user profile
- Long-term (summarized) memory
- Short-term (recent chat context)

--- PERMANENT PROFILE MEMORY ---
${profileLong || "No profile data yet."}

--- LONG TERM MEMORY ---
${sessionLong || "No long-term memory yet."}

--- SHORT TERM MEMORY ---
${shortTerm || "No recent chat memory."}

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
    if (sessionDocs.length > 20) {
      const oldChats = sessionDocs.slice(0, -10).join("\n");

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
app.delete("/session/:userId/:sessionId/memory/:id", async (req, res) => {
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
app.delete("/session/:userId/:sessionId", async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const collectionName = `memory_${userId}_${sessionId}`;
    await chroma.deleteCollection({name: collectionName});
    console.log(`🧹 Cleared all memories for ${userId} (${sessionId})`);
    res.json({ success: true });
  } catch (err) {
    console.error("Error clearing memories:", err);
    res.status(500).json({ error: "Failed to clear memories" });
  }
});

// =======================================================
// ✍️ ROUTE 4b: RENAME A SESSION
// =======================================================
app.post("/session/rename", async (req, res) => {
  try {
    const { userId, sessionId, newTitle } = req.body;
    if (!userId || !sessionId || !newTitle) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const collectionName = `memory_${userId}_${sessionId}`;
    const collection = await chroma.getCollection({name: collectionName});
    
    // Create a new metadata object with the updated title
    const newMetadata = { ...(collection.metadata || {}), title: newTitle };

    // Update the collection's metadata
    await collection.modify({metadata: newMetadata});

    console.log(`✍️ Renamed session for ${userId} from ${sessionId} to ${newTitle}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Error renaming session:", err);
    res.status(500).json({ error: "Failed to rename session" });
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
// 🔍 ROUTE 6b: SEMANTIC MEMORY SEARCH (Keyword + Vector)
// =======================================================
app.post("/memory/search", async (req, res) => {
  try {
    const {
      userId,
      sessionId = "default-session",
      text,
      topK = 8,
    } = req.body;

    if (!userId || !text) {
      return res.status(400).json({ error: "Missing userId or text" });
    }

    const collection = await chroma.getOrCreateCollection({
      name: `memory_${userId}_${sessionId}`,
    });

    // -------- 1) Embed query --------
    const embedModel = genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

    const embedded = await embedModel.embedContent(text);
    const queryVec = embedded.embedding.values;

    // -------- 2) Query vector DB --------
    const result = await collection.query({
      queryEmbeddings: [queryVec],
      nResults: topK,
    });

    const matches = (result.documents?.[0] || []).map((doc, i) => ({
      id: result.ids?.[0]?.[i],
      document: doc,
      metadata: result.metadatas?.[0]?.[i],
      distance: result.distances?.[0]?.[i],
    }));

    res.json({ ok: true, results: matches });
  } catch (err) {
    console.error("Semantic Search Error:", err);
    res.status(500).json({ error: "Semantic search failed" });
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

// ======================================
//  🧠 PROFILE MEMORY - Permanent Storage
// ======================================
app.post("/memory/profile", async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text" });

    const profileCollection = await getProfileCollection(userId);

    // embed text
    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const emb = (await embedModel.embedContent(text)).embedding.values;

    await profileCollection.add({
      ids: [uuid()],
      documents: [text],
      embeddings: [emb],
      metadatas: [
        { role: "profile", ts: Date.now(), type: "profile" }
      ]
    });

    res.json({ saved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save profile memory" });
  }
});

// =======================================================
// 🗑️ ROUTE 8: DELETE A SPECIFIC MEMORY ENTRY (POST)
// =======================================================
app.post("/memory/delete", async (req, res) => {
  try {
    const { userId, sessionId = "default-session", id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Missing required field (id)" });
    }

    const collection = await chroma.getOrCreateCollection({
      name: `memory_${userId}_${sessionId}`,
    });

    await collection.delete({ ids: [id] });

    console.log(`🗑️ Deleted memory ${id} for user ${userId} (${sessionId})`);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting memory:", err);
    res.status(500).json({ error: "Failed to delete memory" });
  }
});

// =======================================================
// ✍️ ROUTE 9: EDIT A SPECIFIC MEMORY ENTRY (POST)
// =======================================================
app.post("/memory/edit", async (req, res) => {
  try {
    const { userId, sessionId = "default-session", id, newDocument } = req.body;
    if (!id || !newDocument) {
      return res.status(400).json({ error: "Missing required fields (id, newDocument)" });
    }

    const collection = await chroma.getOrCreateCollection({
      name: `memory_${userId}_${sessionId}`,
    });

    // 1️⃣ Embed new text
    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const emb = (await embedModel.embedContent(newDocument)).embedding.values;

    // 2️⃣ Fetch existing metadata to preserve it
    const got = await collection.get({ ids: [id] });
    const existingMeta = got.metadatas?.[0] || {};
    
    // Update the summaryText in metadata if it was a summary
    const newMetadata = { ...existingMeta };
    if (existingMeta.type === "summary") {
      newMetadata.summaryText = newDocument;
    }
    newMetadata.ts = Date.now(); // update timestamp

    // 3️⃣ Update in Chroma
    await collection.update({
      ids: [id],
      documents: [newDocument],
      embeddings: [emb],
      metadatas: [newMetadata],
    });

    console.log(`✍️ Edited memory ${id} for user ${userId} (${sessionId})`);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error editing memory:", err);
    res.status(500).json({ error: "Failed to edit memory" });
  }
});

app.listen(5050, () => {
  console.log("🚀 Memory Server running at http://localhost:5050");
});
