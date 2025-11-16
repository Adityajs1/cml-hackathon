"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b border-neutral-800 sticky top-0 backdrop-blur-md bg-[#0b0b0b]/80 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
        <Link href="/" className="font-semibold text-lg tracking-tight text-white">
          Neuron
        </Link>
        <nav className="hidden md:flex flex-1 justify-center items-center gap-8 text-sm text-neutral-400">
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
          <Link href="/docs" className="hover:text-white transition-colors">
            Docs
          </Link>
          <Link href="/signup" className="hover:text-white transition-colors">
            Consumer
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline" className="border-neutral-700 text-black font-medium hover:bg-neutral-800">
              Login
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
