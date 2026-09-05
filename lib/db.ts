import pg from "pg";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "postgresql://postgres:postgres@localhost:5432/neuron_db";

let pool: any = null;
let usePostgres = false;

try {
  pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 3000,
  });
} catch (_e) {
  console.log("⚠️ Could not create Postgres pool, using file storage fallback.");
}

const FILE_DB_PATH = path.join(process.cwd(), "data", "neuron_db.json");

function ensureFileDb() {
  const dir = path.dirname(FILE_DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE_DB_PATH)) {
    const initial = { users: [], memories: [], sessions: [] };
    fs.writeFileSync(FILE_DB_PATH, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(FILE_DB_PATH, "utf8"));
  } catch (_e) {
    const initial = { users: [], memories: [], sessions: [] };
    fs.writeFileSync(FILE_DB_PATH, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
}

function saveFileDb(data: any) {
  const dir = path.dirname(FILE_DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = FILE_DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, FILE_DB_PATH);
}

async function initPgTables() {
  if (!pool) return false;
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name VARCHAR(255),
          created_at BIGINT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          expires_at BIGINT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS memories (
          id UUID PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          text TEXT NOT NULL,
          embedding JSONB,
          importance_score REAL DEFAULT 0,
          pinned BOOLEAN DEFAULT FALSE,
          created_at BIGINT NOT NULL
        );
      `);
      usePostgres = true;
      return true;
    } finally {
      client.release();
    }
  } catch (_err) {
    usePostgres = false;
    return false;
  }
}

initPgTables().catch(() => {});

export function hashPassword(password: string): string {
  const salt = "neuron_salt_express_2025";
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export const localDb = {
  async findUserByEmail(email: string) {
    if (!email) return null;
    const lowerEmail = email.toLowerCase();
    if (usePostgres && pool) {
      try {
        const res = await pool.query("SELECT * FROM users WHERE LOWER(email) = $1", [lowerEmail]);
        return res.rows[0] || null;
      } catch (_e) {}
    }
    return ensureFileDb().users.find((u: any) => u.email.toLowerCase() === lowerEmail) || null;
  },

  async findUserById(id: string) {
    if (!id) return null;
    if (usePostgres && pool) {
      try {
        const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        return res.rows[0] || null;
      } catch (_e) {}
    }
    return ensureFileDb().users.find((u: any) => u.id === id) || null;
  },

  async createUser({ email, password, name }: { email: string; password: string; name?: string }) {
    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);
    const userName = name || email.split("@")[0];
    const createdAt = Date.now();

    if (usePostgres && pool) {
      try {
        const res = await pool.query(
          "INSERT INTO users (id, email, password_hash, name, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name",
          [userId, email.toLowerCase(), passwordHash, userName, createdAt]
        );
        return res.rows[0];
      } catch (_e) {}
    }

    const currentDb = ensureFileDb();
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name: userName,
      created_at: createdAt,
    };
    currentDb.users.push(newUser);
    saveFileDb(currentDb);
    return { id: newUser.id, email: newUser.email, name: newUser.name };
  },

  async createSession(userId: string) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    if (usePostgres && pool) {
      try {
        await pool.query(
          "INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)",
          [token, userId, expiresAt]
        );
        return { token, user_id: userId, expires_at: expiresAt };
      } catch (_e) {}
    }

    const currentDb = ensureFileDb();
    const session = { token, user_id: userId, expires_at: expiresAt };
    currentDb.sessions.push(session);
    saveFileDb(currentDb);
    return session;
  },

  async getSession(token: string) {
    if (!token) return null;
    if (usePostgres && pool) {
      try {
        const res = await pool.query(
          "SELECT s.token, s.expires_at, u.id, u.email, u.name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1",
          [token]
        );
        const row = res.rows[0];
        if (row && Number(row.expires_at) > Date.now()) {
          return { token: row.token, user: { id: row.id, email: row.email, name: row.name } };
        }
        return null;
      } catch (_e) {}
    }

    const currentDb = ensureFileDb();
    const session = currentDb.sessions.find((s: any) => s.token === token);
    if (session && session.expires_at > Date.now()) {
      const user = currentDb.users.find((u: any) => u.id === session.user_id);
      if (user) {
        return { token: session.token, user: { id: user.id, email: user.email, name: user.name } };
      }
    }
    return null;
  },

  async deleteSession(token: string) {
    if (usePostgres && pool) {
      try {
        await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
        return;
      } catch (_e) {}
    }
    const currentDb = ensureFileDb();
    currentDb.sessions = currentDb.sessions.filter((s: any) => s.token !== token);
    saveFileDb(currentDb);
  },

  async insertMemory({ user_id, text, embedding = [], importance_score = 0, pinned = false }: any) {
    const memoryId = crypto.randomUUID();
    const createdAt = Date.now();

    if (usePostgres && pool) {
      try {
        const res = await pool.query(
          "INSERT INTO memories (id, user_id, text, embedding, importance_score, pinned, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
          [memoryId, user_id, text, JSON.stringify(embedding), importance_score, pinned, createdAt]
        );
        return res.rows[0];
      } catch (_e) {}
    }

    const currentDb = ensureFileDb();
    const memoryRow = {
      id: memoryId,
      user_id,
      text,
      embedding,
      importance_score,
      pinned,
      created_at: createdAt,
    };
    currentDb.memories.push(memoryRow);
    saveFileDb(currentDb);
    return memoryRow;
  },

  async getMemoriesByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];
    if (usePostgres && pool) {
      try {
        const res = await pool.query("SELECT * FROM memories WHERE id = ANY($1::uuid[])", [ids]);
        return res.rows;
      } catch (_e) {}
    }

    const currentDb = ensureFileDb();
    const set = new Set(ids);
    return currentDb.memories.filter((m: any) => set.has(m.id));
  },
};
