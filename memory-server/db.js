import fs from "fs";
import path from "path";
import crypto from "crypto";

const DB_PATH = path.join(process.cwd(), "data", "neuron_db.json");

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const initial = { users: [], memories: [], sessions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  try {
    const content = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(content);
  } catch (_e) {
    const initial = { users: [], memories: [], sessions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
}

function saveDb(data) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, DB_PATH);
}

export function hashPassword(password) {
  const salt = "neuron_salt_express_2025";
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export const db = {
  findUserByEmail(email) {
    if (!email) return null;
    return ensureDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findUserById(id) {
    if (!id) return null;
    return ensureDb().users.find((u) => u.id === id) || null;
  },

  createUser({ email, password, name }) {
    const currentDb = ensureDb();
    const newUser = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      password_hash: hashPassword(password),
      name: name || email.split("@")[0],
      created_at: Date.now(),
    };
    currentDb.users.push(newUser);
    saveDb(currentDb);
    return { id: newUser.id, email: newUser.email, name: newUser.name };
  },

  createSession(userId) {
    const currentDb = ensureDb();
    const token = crypto.randomBytes(32).toString("hex");
    const session = {
      token,
      user_id: userId,
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    currentDb.sessions.push(session);
    saveDb(currentDb);
    return session;
  },

  getSession(token) {
    if (!token) return null;
    const currentDb = ensureDb();
    const session = currentDb.sessions.find((s) => s.token === token);
    if (session && session.expires_at > Date.now()) {
      const user = currentDb.users.find((u) => u.id === session.user_id);
      if (user) {
        return { token: session.token, user: { id: user.id, email: user.email, name: user.name } };
      }
    }
    return null;
  },

  deleteSession(token) {
    const currentDb = ensureDb();
    currentDb.sessions = currentDb.sessions.filter((s) => s.token !== token);
    saveDb(currentDb);
  },

  insertMemory({ user_id, text, embedding = [], importance_score = 0, pinned = false }) {
    const currentDb = ensureDb();
    const memoryRow = {
      id: crypto.randomUUID(),
      user_id,
      text,
      embedding,
      importance_score,
      pinned,
      created_at: Date.now(),
    };
    currentDb.memories.push(memoryRow);
    saveDb(currentDb);
    return memoryRow;
  },

  getMemoriesByIds(ids) {
    const currentDb = ensureDb();
    const set = new Set(ids);
    return currentDb.memories.filter((m) => set.has(m.id));
  },
};
