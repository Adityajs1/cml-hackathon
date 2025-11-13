"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = { role: "user" | "ai"; content: string };

import { User } from "@supabase/supabase-js";

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.push("/login");
      else setUser(data.user);
    };
    getUser();
  }, [router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const newMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/api/chat", {
        userId: user.id,
        message: input,
      });

      if (res.data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: res.data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "⚠️ No response received from Gemini." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "⚠️ Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <main className="flex min-h-screen bg-[#0E1523] text-white">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#1f2937] bg-[#0E1523] p-6">
        <h1 className="text-2xl font-semibold text-blue-400 mb-6">Neuron</h1>
        <div className="space-y-2 text-sm text-blue-300/70">
          <p>🧠 Context Memory Active</p>
          <p>👤 {user.email}</p>
        </div>
      </aside>

      {/* Chat Section */}
      <section className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-[#1e2b4a] p-4 flex items-center justify-between bg-[#0E1523]/70 backdrop-blur">
          <h2 className="text-blue-300 font-medium">
            Context Memory Layer Chat
          </h2>
        </header>

        {/* Chat messages */}
        <ScrollArea className="flex-1 p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-blue-300/60 mt-20">
              <p>Start a conversation with your AI memory layer 🤖</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "ml-auto bg-[#0a1322] border border-[#1e2b4a] text-blue-200"
                  : "mr-auto bg-[#0a1322] border border-[#1e2b4a] text-blue-200"
              }`}
            >
              {msg.content}
            </div>
          ))}
          <div ref={chatEndRef} />
        </ScrollArea>

        {/* Input */}
        <Card className="border-t border-[#1e2b4a] bg-[#0E1523]/80 backdrop-blur-sm p-4 flex items-center gap-3 mb-4 mx-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-[#0a1322] border-[#1e2b4a] text-blue-100 placeholder:text-blue-300/40"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button
            onClick={sendMessage}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:opacity-90 px-6"
          >
            {loading ? "..." : "Send"}
          </Button>
        </Card>
      </section>
    </main>
  );
}

