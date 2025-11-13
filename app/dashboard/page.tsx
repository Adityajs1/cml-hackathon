
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

import { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
      } else {
        setUser(data.user);
      }
      setLoading(false);
    };
    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading dashboard...
      </div>
    );

  if (!user) return null;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-20">
      {/* Header */}
      <div className="flex w-full max-w-5xl justify-between items-center mb-12">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Welcome,{" "}
          <span className="text-white">
            {user.user_metadata?.full_name || user.email}
          </span>
        </h1>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="border-white text-black hover:bg-white hover:text-black"
        >
          Logout
        </Button>
      </div>

      {/* Dashboard Content */}
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl">
        <Card className="bg-neutral-900 border border-neutral-700 p-6 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.25)]">
          <h2 className="text-lg font-semibold text-white mb-3">
            Your Memory Layer
          </h2>
          <p className="text-neutral-300 text-sm leading-relaxed">
            Here’s where your contextual data will live — interactions, summaries, 
            and insights learned over time. 
            <br />
            You’ll be able to visualize, reset, or inspect your AI’s memory soon.
          </p>
          <Button
            variant="outline"
            className="mt-4 border-white text-black hover:bg-white hover:text-black"
            onClick={() => alert("Memory visualization coming soon!")}
          >
            View Memory
          </Button>
        </Card>

        <Card className="bg-neutral-900 border border-neutral-700 p-6 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.25)]">
          <h2 className="text-lg font-semibold text-white mb-3">
            Quick Actions
          </h2>
          <ul className="text-neutral-300 text-sm space-y-3">
            <li>💬 Start a new chat session</li>
            <li>🧠 Summarize current memory</li>
            <li>⚙️ Connect API keys or integrations</li>
          </ul>
          <Link href="/chat">
            <Button
              className="mt-4 bg-white text-black font-medium hover:bg-neutral-200 transition-all"
            >
              Open Chat Interface
            </Button>
          </Link>
        </Card>
      </div>

      {/* Footer Section */}
      <div className="mt-20 text-center text-sm text-neutral-400">
        <p>
          Memory stored securely for user:{" "}
          <span className="font-mono text-white">{user.id}</span>
        </p>
      </div>
    </main>
  );
}
