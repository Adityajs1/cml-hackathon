// lib/authClient.ts
// Direct client authentication layer calling Express backend (port 5050)

const SERVER_URL = "http://localhost:5050";
const TOKEN_KEY = "neuron_session_token";
const USER_KEY = "neuron_user";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  user_metadata?: {
    full_name?: string;
  };
};

export const authClient = {
  async signUp({ email, password, name }: { email: string; password: string; name?: string }) {
    try {
      const res = await fetch(`${SERVER_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { data: { user: null }, error: { message: data.error || "Signup failed" } };
      }
      const userObj: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        user_metadata: { full_name: data.user.name },
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(userObj));
      }
      return { data: { user: userObj }, error: null };
    } catch (_err: any) {
      return { data: { user: null }, error: { message: "Could not connect to authentication server." } };
    }
  },

  async signIn({ email, password }: { email: string; password: string }) {
    try {
      const res = await fetch(`${SERVER_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { data: { user: null }, error: { message: data.error || "Login failed" } };
      }
      const userObj: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        user_metadata: { full_name: data.user.name },
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(userObj));
      }
      return { data: { user: userObj }, error: null };
    } catch (_err: any) {
      return { data: { user: null }, error: { message: "Could not connect to authentication server." } };
    }
  },

  async getUser(): Promise<{ data: { user: AuthUser | null } }> {
    if (typeof window === "undefined") {
      return { data: { user: null } };
    }
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        return { data: { user: JSON.parse(stored) as AuthUser } };
      } catch (_e) {}
    }
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return { data: { user: null } };

    try {
      const res = await fetch(`${SERVER_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok && data.user) {
        const userObj: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          user_metadata: { full_name: data.user.name },
        };
        localStorage.setItem(USER_KEY, JSON.stringify(userObj));
        return { data: { user: userObj } };
      }
    } catch (_e) {}
    return { data: { user: null } };
  },

  async signOut() {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        fetch(`${SERVER_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return { error: null };
  },
};
