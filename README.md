 Neuron
 A context-memory layer for LLMs — enabling persistent, semantically-aware conversations.**

Neuron sits between the user and an LLM (Gemini API) to give it long-term memory. Instead of every prompt starting from a blank slate, Neuron checks whether a new prompt is semantically similar to something the user has asked before, retrieves the relevant past context, and uses it to generate a more coherent, continuous response — even across separate sessions.

## Table of Contents

- [Problem](#problem)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Roadmap](#roadmap)

## Problem

LLM APIs are stateless. Every request is independent unless you manually stuff prior messages into the context window — which is expensive, doesn't scale, and quickly hits token limits. Most "memory" solutions either:

- Dump entire chat history into every prompt (wasteful, slow, costly), or
- Have no memory at all (repetitive, disjointed conversations).

Neuron solves this by storing only the **meaning** of past exchanges as vector embeddings, and retrieving just the relevant slice of memory when it's actually needed — not the whole history, every time.



## How It Works

Neuron's core loop has two branches: **first-time prompts** (which get stored) and **repeat/related prompts** (which get matched against memory).

                         ┌───────────────────────┐
                    ┌───▶│   User enters a prompt │◀────────────┐
                    │    └───────────┬───────────┘              │
                    │                │                          │
             prompt 2│                │ prompt 1                 │
                    │                ▼                          │
                    │         ┌─────────────┐                   │
                    │         │  response   │                   │
                    │         └──────┬──────┘                   │
                    │                │ keywords                 │
                    │                ▼                          │
                    │   ┌─────────────────────────────┐         │
                    │   │ stored in ChromaDB as vector │────────▶│  (db)
                    │   │  embeddings (mathematical    │         │
                    │   │      vector format)          │         │
                    │   └─────────────────────────────┘         │
                    │                                            │
                    ▼                                            │
         ┌───────────────────────┐                                │
         │ check similarity      │                                │
         │     & context         │────────────────────────────────┘
         └───────────┬───────────┘
              if no   │   if yes
        ┌─────────────┘   └─────────────────┐
        ▼                                    ▼
┌────────────────────┐          ┌────────────────────────────┐
│  new response is    │          │ the contextual response    │
│ generated in similar│          │       is generated         │
│      format         │          │                             │
└──────────────────────┘          └────────────────────────────┘
```

**Step by step:**

1. **User enters a prompt.**
2. **First encounter (prompt 1):** the LLM generates a `response`. Keywords/embeddings are extracted from the response and stored in **ChromaDB** as vector embeddings — this becomes the persistent memory ("db").
3. **Follow-up encounter (prompt 2):** instead of generating blindly, Neuron runs a **similarity & context check** against ChromaDB, comparing the new prompt's embedding against stored vectors.
   - **If yes (match found):** the relevant stored context is pulled in, and a **contextual response** is generated using that history.
   - **If no (no match):** a **new response is generated in a similar format**, and it's fed back into the storage pipeline so future prompts can match against it.
4. The loop continues — every new response enriches the vector store, so the system's contextual awareness compounds over time.

---

## Architecture

| Layer | Responsibility |
|---|---|
| **Next.js (Frontend + API routes)** | Chat UI, prompt submission, orchestration of the request/response/embedding pipeline |
| **Supabase** | Authentication (user accounts/sessions) and relational metadata (e.g. conversation/session records) |
| **ChromaDB** | Vector store — holds embeddings of past responses/keywords for similarity search |
| **Gemini API** | LLM used for generating responses and (optionally) extracting keywords/embeddings |

**Request lifecycle:**

```
Client (Next.js UI)
   │  prompt
   ▼
Next.js API route
   │  1. authenticate user (Supabase)
   │  2. embed the incoming prompt
   │  3. query ChromaDB for nearest neighbors (similarity search)
   ▼
Decision: similarity above threshold?
   ├─ Yes → fetch matched context → inject into prompt → call Gemini → contextual response
   └─ No  → call Gemini fresh → generate response → extract keywords → embed → upsert into ChromaDB
   │
   ▼
Response streamed back to client
```

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Auth:** Supabase Auth
- **Vector Database:** ChromaDB
- **LLM Provider:** Gemini API
- **Language:** TypeScript

---

## Project Structure

```
neuron/
├── app/
│   ├── api/
│   │   ├── chat/          # handles prompt -> similarity check -> response
│   │   └── auth/          # Supabase auth routes
│   ├── (chat)/            # chat UI
│   └── layout.tsx
├── lib/
│   ├── chroma/            # ChromaDB client + upsert/query helpers
│   ├── gemini/            # Gemini API client + prompt builders
│   ├── supabase/          # Supabase client (browser + server)
│   └── similarity.ts      # threshold logic for "if yes / if no" branch
├── types/
├── .env.local.example
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (URL + anon/service keys)
- A running ChromaDB instance (local via Docker, or hosted)
- A Gemini API key

### Installation

```bash
git clone <repo-url>
cd neuron
npm install
```

### Run ChromaDB locally (optional, if not using a hosted instance)

```bash
docker run -p 8000:8000 chromadb/chroma
```

### Start the dev server

```bash
npm run dev
```

App will be available at `http://localhost:3000`.

---

## Environment Variables

Create a `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ChromaDB
CHROMA_DB_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=neuron_memory

# Gemini
GEMINI_API_KEY=
```

---

## Roadmap

- [ ] Tune similarity threshold dynamically per user/session instead of a fixed cutoff
- [ ] Add memory expiry/decay so stale context doesn't pollute retrieval
- [ ] Support multi-turn context windows (not just single prompt-response pairs)
- [ ] Add a memory inspector UI to visualize what's stored per user
- [ ] Evaluate swapping/augmenting ChromaDB with a hosted vector DB for production scale

---

## License

MIT
