"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Heatmap from "@/components/memory/Heatmap";
import Timeline from "@/components/memory/Timeline";

type MemoryItem = {
  id: string;
  document: string;
  metadata?: { role?: string; type?: string; ts?: number; sessionId?: string };
};

const USER_ID = "32dac220-1244-4335-95c2-86a4da97d1ff";

export default function MemoryDashboard() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState("default-session");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Context modal
  const [contextOpen, setContextOpen] = useState(false);
  const [contextResults, setContextResults] = useState<MemoryItem[]>([]);
  const [contextFor, setContextFor] = useState<MemoryItem | null>(null);

  // Rewrite modal
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [rewriteFor, setRewriteFor] = useState<MemoryItem | null>(null);
  const [instruction, setInstruction] = useState(
    "Improve clarity and concision. Keep important facts."
  );

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editFor, setEditFor] = useState<MemoryItem | null>(null);
  const [editText, setEditText] = useState("");


  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<MemoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);


  // --------------------------
  // Fetch Sessions
  // --------------------------
  const fetchSessions = useCallback(async () => {
    const res = await fetch(`http://localhost:5050/sessions?userId=${USER_ID}`);
    const data = await res.json();
    setSessions(data.length ? data : ["default-session"]);
  }, []);

  // --------------------------
  // Fetch Memories
  // --------------------------
  const fetchMemories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5050/memories?userId=${USER_ID}&sessionId=${sessionId}`
      );
      const data = await res.json();
      setMemories(data);
    } catch (err) {
      console.error("Failed to fetch memories:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  // -------------------------
  // Filtering
  // -------------------------
  const filtered = useMemo(() => {
    return memories.filter((m) => {
      if (filter === "all") return true;
      if (filter === "user") return m.metadata?.role === "user";
      if (filter === "ai") return m.metadata?.role === "ai";
      if (filter === "summary") return m.metadata?.type === "summary";
      return true;
    });
  }, [memories, filter]);

  const displayedItems = useMemo(() => {
    if (search.trim() && isSearching) {
      return searchResults;
    }
    return filtered;
  }, [filtered, search, searchResults, isSearching]);

  // -------------------------
  // Context Modal
  // -------------------------
  const handleShowContext = async (item: MemoryItem) => {
    try {
      setContextOpen(true);
      setContextFor(item);
      const res = await fetch("http://localhost:5050/memory/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: USER_ID,
          sessionId,
          text: item.document,
          topK: 6,
        }),
      });
      setContextResults(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------
  // Rewrite Modal
  // -------------------------
  const handleRewrite = (item: MemoryItem) => {
    setRewriteFor(item);
    setInstruction("Improve clarity and concision. Keep important facts.");
    setRewriteOpen(true);
  };

  const runRewrite = async () => {
    if (!rewriteFor) return;
    const res = await fetch("http://localhost:5050/memory/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: USER_ID,
        sessionId,
        id: rewriteFor.id,
        instruction,
      }),
    });

    const data = await res.json();
    if (data?.ok) {
      setRewriteOpen(false);
      fetchMemories();
    }
  };

  // -------------------------
  // DELETE Memory
  // -------------------------
  const handleDelete = async (item: MemoryItem) => {
    if (!confirm("Delete this memory?")) return;

    try {
      const res = await fetch("http://localhost:5050/memory/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: USER_ID,
          sessionId,
          id: item.id,
        }),
      });

      const data = await res.json();
      if (data?.ok) fetchMemories();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // -------------------------
  // EDIT Memory
  // -------------------------
  const handleEdit = (item: MemoryItem) => {
    setEditFor(item);
    setEditText(item.document);
    setEditOpen(true);
  };

  const runEdit = async () => {
    if (!editFor) return;

    try {
      const res = await fetch("http://localhost:5050/memory/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: USER_ID,
          sessionId,
          id: editFor.id,
          newDocument: editText,
        }),
      });

      const data = await res.json();
      if (data?.ok) {
        setEditOpen(false);
        fetchMemories();
      }
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  // --------------------------------------------------------
  // UI
  // --------------------------------------------------------
  const runSearch = async () => {
  const query = search.trim();
  if (!query) {
    setIsSearching(false);
    setSearchResults([]);
    return;
  }

  try {
    setIsSearching(true);

    const res = await fetch("http://localhost:5050/memory/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: USER_ID,
        sessionId,
        text: query,
        topK: 10,
      }),
    });

    const data = await res.json();
    if (data?.results) {
      setSearchResults(data.results);
    }
  } catch (err) {
    console.error("Search error:", err);
  }
};

  return (
    <main className="min-h-screen bg-[#0E1523] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-6">

      {/* HEADER */}
<div className="flex flex-wrap items-center gap-4 justify-between">
  <h1 className="text-3xl font-semibold text-blue-400">
    🧠 Memory Dashboard
  </h1>

  <div className="flex gap-3">
    <select
      value={sessionId}
      onChange={(e) => setSessionId(e.target.value)}
      className="bg-[#0a1322] border border-[#1e2b4a] text-blue-100 p-2 rounded-md"
    >
      {sessions.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>

    <select
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      className="bg-[#0a1322] border border-[#1e2b4a] text-blue-100 p-2 rounded-md"
    >
      <option value="all">All</option>
      <option value="user">User</option>
      <option value="ai">AI</option>
      <option value="summary">Summaries</option>
    </select>

    <Button onClick={fetchMemories} className="bg-blue-600 hover:bg-blue-500">
      Refresh
    </Button>
  </div>
</div>

{/* SEARCH BAR */}
<div className="mt-4 flex gap-3">
  <input
    value={search}
    onChange={(e) => {
      setSearch(e.target.value);
      if (e.target.value === "") {
        setIsSearching(false);
        setSearchResults([]);
      }
    }}
    onKeyDown={(e) => e.key === "Enter" && runSearch()}
    placeholder="Search memories (semantic + keyword)..."
    className="flex-1 bg-[#0a1322] border border-[#1e2b4a] text-blue-100 p-2 rounded-md"
  />

  <Button onClick={runSearch} className="bg-blue-600 hover:bg-blue-500">
    Search
  </Button>
</div>


        {/* HEATMAP */}
        <Card className="p-4 bg-[#0a1322] border border-[#1e2b4a]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-blue-300">Activity Heatmap (12 weeks)</h2>
            <span className="text-xs text-blue-400/70">
              {memories.length} items
            </span>
          </div>

          <Heatmap userId={USER_ID} sessionId={sessionId} weeks={12} />
        </Card>

        {/* TIMELINE */}
        <ScrollArea className="h-[60vh] rounded-lg border border-[#1e2b4a] p-4">
          {loading ? (
            <p className="text-blue-300/70">Loading memories...</p>
          ) : displayedItems.length === 0 ? (
            <p className="text-blue-300/70">No memories found.</p>
          ) : (
            <Timeline
              items={displayedItems}
              onShowContext={handleShowContext}
              onRewrite={handleRewrite}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          )}
        </ScrollArea>

        {/* CONTEXT MODAL */}
        {contextOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="w-[700px] max-w-[95vw] bg-[#0a1322] border border-[#1e2b4a] rounded-xl p-5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-blue-300">Context for Summary</h3>
                <button
                  onClick={() => setContextOpen(false)}
                  className="text-blue-300/70 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {contextFor && (
                <div className="mb-4 p-3 bg-[#0e1a2c] border border-[#1e2b4a] rounded text-blue-100 text-sm italic">
                  &quot;{contextFor.document}&quot;
                </div>
              )}

              <p className="text-sm text-blue-300/70 mb-3">
                Matching snippets (semantic search).
              </p>

              <div className="space-y-2 max-h-[50vh] overflow-auto">
                {contextResults.map((c) => (
                  <Card key={c.id} className="p-3 bg-[#0e1a2c] border-[#1e2b4a]">
                    <div className="text-xs text-blue-400/60 mb-1">
                      {(c.metadata?.role || "system").toUpperCase()} •{" "}
                      {new Date(c.metadata?.ts || 0).toLocaleString()}
                    </div>
                    <div className="text-blue-100 whitespace-pre-wrap">
                      {c.document}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="w-[650px] max-w-[95vw] bg-[#0a1322] border border-[#1e2b4a] rounded-xl p-5 space-y-3">
              
              <div className="flex justify-between items-center">
                <h3 className="text-blue-300">Edit Memory</h3>
                <button
                  onClick={() => setEditOpen(false)}
                  className="text-blue-300/70 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-blue-400/70">Current content:</div>
              <Card className="p-3 bg-[#0e1a2c] border-[#1e2b4a] text-blue-100 whitespace-pre-wrap">
                {editFor?.document}
              </Card>

              <div className="text-xs text-blue-400/70">Updated text</div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full h-32 bg-[#0e1a2c] border border-[#1e2b4a] text-blue-100 p-2 rounded resize-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setEditOpen(false)}
                  className="bg-[#132036]"
                >
                  Cancel
                </Button>
                <Button onClick={runEdit} className="bg-blue-600 hover:bg-blue-500">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* REWRITE MODAL */}
        {rewriteOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="w-[650px] max-w-[95vw] bg-[#0a1322] border border-[#1e2b4a] rounded-xl p-5 space-y-3">

              <div className="flex justify-between items-center">
                <h3 className="text-blue-300">Rewrite Summary</h3>
                <button
                  onClick={() => setRewriteOpen(false)}
                  className="text-blue-300/70 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-blue-400/70">Current summary:</div>

              <Card className="p-3 bg-[#0e1a2c] border-[#1e2b4a] text-blue-100 whitespace-pre-wrap">
                {rewriteFor?.document}
              </Card>

              <div className="text-xs text-blue-400/70">Instruction</div>

              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="bg-[#0e1a2c] border border-[#1e2b4a] text-blue-100 p-2 w-full rounded"
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setRewriteOpen(false)}
                  className="bg-[#132036]"
                >
                  Cancel
                </Button>
                <Button onClick={runRewrite} className="bg-blue-600 hover:bg-blue-500">
                  Rewrite & Replace
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

