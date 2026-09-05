import fs from "fs";
import path from "path";
import crypto from "crypto";

const DB_PATH = path.join(process.cwd(), "data", "neuron_local.json");

export type UserRecord = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  created_at: number;
};

export type MemoryRecord = {
  id: string;
  user_id: string;
  text: string;
  embedding: number[];
  importance_score: number;
  pinned: boolean;
  do_not_store_again: boolean;
  created_at: number;
};

export type SessionRecord = {
  token: string;
  user_id: string;
  expires_at: number;
};

type Schema = {
  users: UserRecord[];
  memories: MemoryRecord[];
  sessions: SessionRecord[];
};

function ensureDbFile(): Schema {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial: Schema = { users: [], memories: [], sessions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  try {
    const content = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(content);
  } catch (_err) {
    const initial: Schema = { users: [], memories: [], sessions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
}

function saveDb(data: Schema) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, DB_PATH);
}

export function hashPassword(password: string): string {
  const salt = "neuron_salt_2025";
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export const localDb = {
  getUsers(): UserRecord[] {
    return ensureDbFile().users;
  },
  findUserByEmail(email: string): UserRecord | undefined {
    return ensureDbFile().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserById(id: string): UserRecord | undefined {
    return ensureDbFile().users.find((u) => u.id === id);
  },
  createUser(user: Omit<UserRecord, "id" | "created_at">): UserRecord {
    const db = ensureDbFile();
    const newUser: UserRecord = {
      ...user,
      id: crypto.randomUUID(),
      created_at: Date.now(),
    };
    db.users.push(newUser);
    saveDb(db);
    return newUser;
  },
  createSession(userId: string): SessionRecord {
    const db = ensureDbFile();
    const token = crypto.randomBytes(32).toString("hex");
    const session: SessionRecord = {
      token,
      user_id: userId,
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    db.sessions.push(session);
    saveDb(db);
    return session;
  },
  getSession(token: string): SessionRecord | undefined {
    const db = ensureDbFile();
    const session = db.sessions.find((s) => s.token === token);
    if (session && session.expires_at > Date.now()) {
      return session;
    }
    return undefined;
  },
  deleteSession(token: string) {
    const db = ensureDbFile();
    db.sessions = db.sessions.filter((s) => s.token !== token);
    saveDb(db);
  },
  insertMemory(mem: Omit<MemoryRecord, "id" | "created_at">): MemoryRecord {
    const db = ensureDbFile();
    const newMem: MemoryRecord = {
      ...mem,
      id: crypto.randomUUID(),
      created_at: Date.now(),
    };
    db.memories.push(newMem);
    saveDb(db);
    return newMem;
  },
  getMemoriesByIds(ids: string[]): MemoryRecord[] {
    const db = ensureDbFile();
    const set = new Set(ids);
    return db.memories.filter((m) => set.has(m.id));
  },
};
