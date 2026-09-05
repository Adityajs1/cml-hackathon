// lib/supabaseClient.ts
// Local Database & Authentication engine replacing Supabase

import { authClient } from "./authClient";
import { db } from "../memory-server/db.js";

export const supabase = {
  auth: {
    signUp: ({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string } } }) =>
      authClient.signUp({ email, password, name: options?.data?.full_name }),
    signInWithPassword: ({ email, password }: { email: string; password: string }) =>
      authClient.signIn({ email, password }),
    getUser: () => authClient.getUser(),
    signOut: () => authClient.signOut(),
  },

  from(table: string) {
    return {
      insert(row: any) {
        return {
          select() {
            return {
              single() {
                if (table === "memories") {
                  const inserted = db.insertMemory({
                    user_id: row.user_id || "default_user",
                    text: row.text || "",
                    embedding: row.embedding || [],
                    importance_score: row.importance_score ?? 0,
                    pinned: row.pinned ?? false,
                  });
                  return { data: inserted, error: null };
                }
                return { data: row, error: null };
              },
            };
          },
        };
      },
      select(_query?: string) {
        return {
          in(field: string, ids: string[]) {
            if (table === "memories" && field === "id") {
              const data = db.getMemoriesByIds(ids);
              return { data, error: null };
            }
            return { data: [], error: null };
          },
          limit(_count: number) {
            return { data: [], error: null };
          },
        };
      },
    };
  },
};
