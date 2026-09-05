"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { authClient, AuthUser } from "@/lib/authClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = { role: "user" | "ai"; content: string };
type Session = { id: string; title: string; createdAt: number };

export default function ChatPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // ----------- AUTH -----------
  useEffect(() => {
    const getUser = async () => {
      const { data } = await authClient.getUser();
      console.log('User:', data.user);
      if (!data.user) router.push("/login");
      else setUser(data.user);
    };
    getUser();
  }, [router]);

  // ----------- LOAD MESSAGES FOR SESSION -----------
  const loadMessages = useCallback(async (sessionId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5050/memories?userId=${user.id}&sessionId=${sessionId}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        const formattedMessages: Message[] = data
          .sort((a, b) => a.metadata.ts - b.metadata.ts)
          .map((item: any) => ({
            role: item.metadata.role,
            content: item.document,
          }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Failed to load messages", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ----------- CREATE NEW SESSION -----------
  const createNewSession = useCallback(() => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      title: "", // will be set inside setSessions
      createdAt: Date.now(),
    };
    setSessions((prevSessions) => {
      newSession.title = `Chat ${prevSessions.length + 1}`;
      const updated = [newSession, ...prevSessions];
      localStorage.setItem("sessions", JSON.stringify(updated));
      return updated;
    });
    setActiveSession(newSession.id);
    setMessages([]);
    return newSession.id;
  }, []);

  // ----------- SWITCH SESSION -----------
  const switchSession = useCallback((id: string) => {
    setActiveSession(id);
    loadMessages(id);
  }, [loadMessages]);

  // ----------- RENAME SESSION -----------
  const renameSession = useCallback(async (id: string, newTitle: string) => {
    if (!user) return;
    try {
      await fetch(`http://localhost:5050/session/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, sessionId: id, newTitle }),
      });

      setSessions((prevSessions) => {
        const updatedSessions = prevSessions.map((s) =>
          s.id === id ? { ...s, title: newTitle } : s
        );
        localStorage.setItem("sessions", JSON.stringify(updatedSessions));
        return updatedSessions;
      });
    } catch (error) {
      console.error("Failed to rename session", error);
    }
  }, [user]);

  // ----------- DELETE SESSION -----------
  const deleteSession = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await fetch(`http://localhost:5050/session/${user.id}/${id}`, {
        method: "DELETE",
      });

      setSessions((prevSessions) => {
        const updatedSessions = prevSessions.filter((s) => s.id !== id);
        localStorage.setItem("sessions", JSON.stringify(updatedSessions));
        if (activeSession === id) {
          if (updatedSessions.length > 0) {
            setActiveSession(updatedSessions[0].id);
          } else {
            createNewSession();
          }
        }
        return updatedSessions;
      });
    } catch (error) {
      console.error("Failed to delete session", error);
    }
  }, [user, activeSession, createNewSession]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !user || !activeSession) return;

    const newMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const body = {
        userId: user.id,
        message: input,
        sessionId: activeSession,
        ...(messages.length === 0 && { sessionTitle: sessions.find(s => s.id === activeSession)?.title })
      };

      const res = await fetch("http://localhost:5050/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "ai", content: data.reply }]);
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: `⚠️ ${data.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "⚠️ No response received." },
        ]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "⚠️ Could not connect to memory server." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, user, activeSession, messages, sessions]);

  // ----------- LOAD OR CREATE SESSION -----------
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem("sessions");
    let activeId = "";
    if (stored) {
      const parsed: Session[] = JSON.parse(stored);
      setSessions(parsed);
      activeId = parsed[0]?.id || createNewSession();
    } else {
      activeId = createNewSession();
    }
    setActiveSession(activeId);
    if (activeId) {
      loadMessages(activeId);
    }
  }, [user, createNewSession, loadMessages]);


  if (!user) return null;

  return (
    <main className="flex min-h-screen bg-[#0E1523] text-white">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-[#1f2937] bg-[#0E1523] p-6">
        <h1 className="text-2xl font-semibold text-blue-400 mb-6">Neuron</h1>
        <Button
          onClick={createNewSession}
          className="w-full mb-4 bg-blue-600 hover:bg-blue-500"
        >
          + New Chat
        </Button>

        <ScrollArea className="flex-1 pr-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-blue-300/70">No chats yet</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between cursor-pointer mb-2 px-3 py-2 rounded-md transition-colors ${
                  s.id === activeSession
                    ? "bg-blue-600 text-white"
                    : "bg-[#0a1322] text-blue-300 hover:bg-[#101c33]"
                }`}
              >
                <div onClick={() => switchSession(s.id)} className="flex-1 truncate">
                  {s.title}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newName = window.prompt("New session name:", s.title);
                      if (newName) renameSession(s.id, newName);
                    }}
                  >
                    ✏️
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Are you sure?")) deleteSession(s.id);
                    }}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            ))
          )}
        </ScrollArea>

        <div className="mt-6 text-xs text-blue-400/60">
          <p>👤 {user.email}</p>
        </div>
      </aside>

      {/* Chat Section */}
      <section className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-[#1e2b4a] p-4 flex items-center justify-between bg-[#0E1523]/70 backdrop-blur">
          <h2 className="text-blue-300 font-medium">
            {sessions.find((s) => s.id === activeSession)?.title || "Chat"}
          </h2>
        </header>

        {/* Chat Messages */}
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

        {/* Input Box */}
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
