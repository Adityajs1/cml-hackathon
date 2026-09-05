"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/authClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await authClient.signIn({
      email,
      password,
    });

    if (error) setMessage(error.message);
    else {
      setMessage("✅ Logged in successfully!");
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
      <Card className="w-full max-w-sm bg-neutral-900 border border-neutral-700 shadow-[0_0_25px_rgba(0,0,0,0.25)] p-8 rounded-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
          <p className="text-neutral-300 text-sm mt-2">
            Log in to continue with Neuron.
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="text-sm text-neutral-400">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-neutral-900 border-neutral-700 text-neutral-200 focus-visible:ring-neutral-600"
              required
            />
          </div>
          <div>
            <label className="text-sm text-neutral-400">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-neutral-900 border-neutral-700 text-neutral-200 focus-visible:ring-neutral-600"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-4 bg-white text-black font-medium py-2 hover:bg-neutral-200 transition-all"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        {message && (
          <p className="text-center text-sm mt-4 text-neutral-400">{message}</p>
        )}

        <p className="text-center text-sm text-neutral-400 mt-6">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-white hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </main>
  );
}

