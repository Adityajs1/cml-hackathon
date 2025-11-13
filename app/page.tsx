"use client";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gradient-to-b from-[#0b0b0b] to-[#1a1a1a]">
      {/* Hero Section */}
      <section id="hero" className="pt-20 pb-16 max-w-3xl">
        <h1 className="text-7xl md:text-8xl font-semibold text-white leading-tight text-center">
          The <span className="text-neutral-400">Memory</span> for your <span className="text-neutral-400">LLM</span>
        </h1><p className="text-neutral-400 mt-6 text-lg leading-relaxed">
          Give your chatbot long-term memory.  
          A lightweight layer that lets AI remember, retrieve, and evolve —  
          just like a human conversation.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Button className="px-6 py-5 rounded-xl bg-white text-black font-medium hover:bg-neutral-200">
            See Demo
          </Button>
          <Button variant="outline" className="border-neutral-700 text-black font-medium hover:text-white hover:bg-neutral-200">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-20 border-t border-neutral-800">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10 text-left">
          <Feature
            title="Persistent Memory"
            desc="Store, recall, and refine user data across sessions using embeddings."
          />
          <Feature
            title="Context Retrieval"
            desc="Retrieve relevant information instantly from vector storage."
          />
          <Feature
            title="Easy Integration"
            desc="Add memory to any chatbot API with minimal setup using Next.js and ChromaDB."
          />
        </div>
      </section>




      {/* Tech Stack Section */}
      <section id="stack" className="py-20 border-t border-neutral-800 max-w-4xl">
        <h1 className="text-2xl font-semibold mb-3 text-white">Your AI isn&apos;t intelligent until it remembers</h1>
        <h3 className="text-neutral-400">
          AI system lose context as user data evolves.<br />
          Vector databases fail to track relationships.<br />
          RAGs retrieve knowledge but can&apos;t remember.<br />
          Try Neuron's personalised memory.
        </h3>
      </section>

      <section id="demo" className="py-20 border-t border-neutral-800">
        <h2 className="text-3xl font-semibold mb-6 text-white">Live Demo</h2>
        <p className="text-neutral-400">
          Coming soon — connect this website to your API endpoint for real-time memory recall.
        </p>
      </section>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xl font-medium text-white">{title}</h3>
      <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
