"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data: _data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    void _data;

    if (error) setMessage(error.message);
    else setMessage("✅ Check your email for a confirmation link.");
    setLoading(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
      <Card className="w-full max-w-sm bg-neutral-900 border border-neutral-700 p-8 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.25)]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white">Create your account</h1>
          <p className="text-neutral-300 text-sm mt-2">
            Join Neuron and experience contextual AI memory.
          </p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div>
            <label className="text-sm text-neutral-400">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="bg-neutral-900 border-neutral-700 text-neutral-200 focus-visible:ring-neutral-600"
              required
            />
          </div>
          <div>
            <label className="text-sm text-neutral-400">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
              placeholder="••••••••"
              className="bg-neutral-900 border-neutral-700 text-neutral-200 focus-visible:ring-neutral-600"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="mt-4 bg-white text-black font-medium py-2 hover:bg-neutral-200 transition-all"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
        </form>

        {message && (
          <p className="text-center text-sm mt-4 text-neutral-400">{message}</p>
        )}

        <p className="text-center text-sm text-neutral-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </main>
  );
}
