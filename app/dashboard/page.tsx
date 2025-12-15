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


// --- Main App Component ---
export default function App() {
    return (
        <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-black to-[#2F3C7E] text-[#FBEAEB]">

            <main className="w-full">
                {/* Hero Section (Using the user's provided structure and text) */}
                <section id="hero" className="pt-20 pb-16 max-w-3xl mx-auto text-center px-6">
                    <h1 className="text-4xl md:text-5xl font-spectral font-serif font-semibold leading-tight text-center">
                        The <span className="text-[#2F3C7E]">Memory</span> for your <span className="text-[#2F3C7E]">LLM</span>
                    </h1>
                    <p className="text-[#FBEAEB] mt-6 text-base leading-relaxed">
                        Give your chatbot long-term memory.
                        A lightweight layer that lets AI remember, retrieve, and evolve —
                        just like a human conversation.
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <button className="px-4 py-3 rounded-xl bg-white text-black font-small hover:bg-neutral-200 transition duration-200 shadow-lg shadow-white/10">
                            See Demo
                        </button>
                        <button className="px-4 py-3 rounded-xl border border-white/20 text-[#FBEAEB] font-small hover:bg-[#1e2a60] transition duration-200">
                            Learn More
                        </button>
                    </div>
                </section>



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
            </main>

            {/* Footer */}
            <footer className="w-full py-10 border-t border-white/10 bg-[#1e2a60] mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-[#FBEAEB]">
                    <p>&copy; 2025 Neuron. All rights reserved. | <a href="#" className="hover:text-[#FBEAEB]">Privacy</a> | <a href="#" className="hover:text-[#FBEAEB]">Terms</a></p>
                </div>
            </footer>
        </div>
    );
}