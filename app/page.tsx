'use client';

// app/page.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, FileText, Brain } from "lucide-react";
import { motion } from "framer-motion";
import React, { type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

interface FeatureProps {
    icon: React.ComponentType<IconProps>;
    title: string;
    desc: string;
}
function Feature({ icon: Icon, title, desc }: FeatureProps) {
    return (
        <div className="space-y-4 p-6 rounded-xl bg-[#1e2a60] border border-white/10 hover:border-[#FBEAEB] transition duration-300 shadow-lg shadow-[#2F3C7E]/10">
            <div className="w-10 h-10 p-2 rounded-lg bg-[#2F3C7E]/30 text-[#FBEAEB]">
                <Icon className="w-full h-full" />
            </div>
            <h3 className="text-xl font-medium text-[#FBEAEB]">{title}</h3>
            <p className="text-[#FBEAEB] text-base leading-relaxed">{desc}</p>
        </div>
    );
}

// --- Icons (using Lucide-React-style inline SVGs for the features) ---

const IconGraph = (props: IconProps) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12c0 1.2-4.03 8-9 8s-9-6.8-9-8c0-1.2 4.03-8 9-8s9 6.8 9 8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const IconUser = (props: IconProps) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
    </svg>
);

const IconFlash = (props: IconProps) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    </svg>
);

const IconArrowRight = (props: IconProps) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
    </svg>
);

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-[#0a1028] via-[#0c1633] to-[#0f1a3d] text-white overflow-hidden">
        {/* Floating Update Badge - Top Center */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-32 left-1/2 -translate-x-1/2 z-50"
        >
          <Badge className="bg-blue-600/20 text-blue-300 border border-blue-500/50 backdrop-blur-sm px-4 py-2 text-sm">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Update · Neuron is now State-of-the-Art →
          </Badge>
        </motion.div>

        {/* Main Hero Section */}
        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              Personalise your AI app with
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                long-term memory API
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-8 text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Delight your users with blazing fast and scalable memory for your AI application.
              Interoperable between models and modalities.
            </p>

            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold px-10 py-7 text-lg rounded-full shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-300"
              >
                Setup in 5 mins <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-600 text-white hover:bg-white/10 backdrop-blur-sm px-10 py-7 text-lg rounded-full"
              >
                Explore Docs
              </Button>
            </div>
          </motion.div>

          {/* Floating Elements (Decorative) */}
          <div className="absolute left-10 bottom-20 opacity-70">
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 6 }}
              className="relative"
            >
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <FileText className="h-12 w-12 text-blue-400" />
                <div className="text-4xl font-bold mt-2">635</div>
              </div>
            </motion.div>
          </div>

          <div className="absolute right-10 top-60 opacity-60">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="bg-white/5 backdrop-blur-md rounded-3xl p-10 border border-white/10"
            >
              <Brain className="h-20 w-20 text-purple-400" />
            </motion.div>
          </div>
        </div>

                {/* Features Section (Expanded with icons and dark theme) */}
                <section id="features" className="w-full py-20 md:py-28 border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-[#FBEAEB] mb-4">
                                The Core Intelligence is in the Context
                            </h2>
                            <p className="text-[#FBEAEB] max-w-3xl mx-auto">
                                LLMs thrive on context. Neuron provides it instantly, accurately, and at scale.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 text-left">
                            <Feature
                                icon={IconGraph}
                                title="Adaptive Context Graph"
                                desc="Moves beyond vectors. We map relationships between entities, concepts, and user interactions to provide deep, meaningful context on every API call."
                            />
                            <Feature
                                icon={IconUser}
                                title="Evolving User Persona"
                                desc="Automatically track and update user preferences, history, and evolving needs. Your AI remembers everything from the first interaction to the last."
                            />
                            <Feature
                                icon={IconFlash}
                                title="Blazing-Fast Retrieval"
                                desc="Optimized for low-latency API calls. Deliver complex, personalized responses with minimal performance impact, ensuring a smooth user experience."
                            />
                        </div>
                    </div>
                </section>

                {/* Technical Flow Section (Adapted from original HTML) */}
                <section id="flow" className="py-20 md:py-28 bg-[#1e2a60] border-t border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-[#FBEAEB] mb-4">
                                How Neuron Integrates Seamlessly
                            </h2>
                            <p className="text-[#FBEAEB] max-w-2xl mx-auto">
                                A three-step process to give your LLM a long-term memory.
                            </p>
                        </div>

                        {/* Visual Flow Diagram */}
                        <div className="relative flex flex-col lg:flex-row justify-between items-center text-center lg:space-x-8">

                            {/* Step 1: LLM Call & Input */}
                            <div className="flex-1 max-w-sm p-6 rounded-xl border border-white/10 bg-[#1e2a60] mb-8 lg:mb-0 shadow-lg shadow-[#2F3C7E]/10">
                                <div className="mb-4 text-3xl font-bold text-[#FBEAEB]">1</div>
                                <h4 className="text-xl font-semibold mb-2 text-[#FBEAEB]">LLM Call & Input</h4>
                                <p className="text-[#FBEAEB]">Your application sends a request to the LLM with the user's latest query or action.</p>
                                <div className="mt-4 text-sm font-mono text-[#FBEAEB]">User Prompt, Session ID</div>
                            </div>

                            {/* Arrow 1 */}
                            <div className="w-8 h-8 lg:w-16 lg:h-4 text-[#FBEAEB] my-4 lg:my-0 transform lg:rotate-0 rotate-90">
                                <IconArrowRight className="w-full h-full" />
                            </div>
                            <div className="flex-1 max-w-sm p-8 rounded-xl border-2 border-[#2F3C7E] bg-[#1e2a60] shadow-2xl shadow-[#2F3C7E]/30 mb-8 lg:mb-0">
                                <div className="mb-4 text-4xl font-extrabold text-[#FBEAEB]">
                                    Neuron Layer
                                </div>
                                <h4 className="text-xl font-semibold mb-2 text-[#FBEAEB]">Context Retrieval & Graph Update</h4>
                                <p className="text-[#FBEAEB] font-medium">Neuron instantly retrieves relevant memory fragments and updates the user's context graph.</p>
                                <div className="mt-4 text-sm font-mono text-[#FBEAEB]">Low-Latency API Call</div>
                            </div>

                            {/* Arrow 2 */}
                            <div className="w-8 h-8 lg:w-16 lg:h-4 text-[#FBEAEB] my-4 lg:my-0 transform lg:rotate-0 rotate-90">
                                <IconArrowRight className="w-full h-full" />
                            </div>

                            {/* Step 3: Enriched Response */}
                            <div className="flex-1 max-w-sm p-6 rounded-xl border border-white/10 bg-[#1e2a60] shadow-lg shadow-[#2F3C7E]/10">
                                <div className="mb-4 text-3xl font-bold text-[#FBEAEB]">3</div>
                                <h4 className="text-xl font-semibold mb-2 text-[#FBEAEB]">Enriched LLM Output</h4>
                                <p className="text-[#FBEAEB]">The LLM uses the integrated context to generate a personalized and intelligent response.</p>
                                <div className="mt-4 text-sm font-mono text-[#FBEAEB]">Personalized Reply</div>
                            </div>
                        </div>
                    </div>
                </section>


                {/* Final Call to Action Section */}
                <section id="cta" className="py-20">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-4xl font-extrabold mb-4 text-[#FBEAEB]">
                            Ready to Ship Truly Intelligent AI?
                        </h2>
                        <p className="text-[#FBEAEB] mb-8">
                            Integrate Neuron today and start building personalized, stateful applications that feel like magic.
                        </p>
                        <button className="px-8 py-4 rounded-xl bg-[#2F3C7E] hover:bg-[#1e2a60] text-[#FBEAEB] font-bold transition duration-300 shadow-xl shadow-[#2F3C7E]/20">
                            Get Started Now
                        </button>
                    </div>
                </section>


        {/* Bottom subtle glow */}
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-blue-900/20 to-transparent pointer-events-none" />
      </div>

            {/* Footer */}
            <footer className="w-full py-10 border-t border-white/10 bg-[#1e2a60] mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-[#FBEAEB]">
                    <p>&copy; 2025 Neuron. All rights reserved. | <a href="#" className="hover:text-[#FBEAEB]">Privacy</a> | <a href="#" className="hover:text-[#FBEAEB]">Terms</a></p>
                        </div>
                    </footer>
        
    </>
  );
}