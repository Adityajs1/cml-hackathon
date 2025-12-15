"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 backdrop-blur-md bg-gradient-to-b from-[#0a1028]/80 via-[#0c1633]/80 to-[#0f1a3d]/80 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
        <Link href="/" className="font-semibold text-lg tracking-tight text-[#FBEAEB] flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain w-6 h-6 mr-2">
            <path d="M12 5a3 3 0 1 0 0 6M12 5a3 3 1 1 1 0 6M12 11a3 3 0 1 0 0 6m0-6a3 3 0 1 1 0 6M20 16a3 3 0 1 0 0 6M20 16a3 3 1 1 1 0 6M4 16a3 3 0 1 0 0 6M4 16a3 3 1 1 1 0 6M20 8a3 3 0 1 0 0 6M20 8a3 3 1 1 1 0 6M4 8a3 3 0 1 0 0 6M4 8a3 3 1 1 1 0 6M12 19a3 3 0 1 0 0 6M12 19a3 3 0 1 1 0 6M12 11h.01M12 16h.01M20 13h.01M20 18h.01M4 13h.01M4 18h.01"/>
          </svg>
          Neuron
        </Link>
        <nav className="hidden md:flex flex-1 justify-center items-center gap-8 text-sm text-[#FBEAEB]">
          <Link href="/about" className="hover:text-[#FBEAEB] transition-colors">
            About
          </Link>
          <Link href="/docs" className="hover:text-[#FBEAEB] transition-colors">
            Docs
          </Link>
          <Link href="/signup" className="hover:text-[#FBEAEB] transition-colors">
            Consumer
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline" className="border-white/20 text-[#FBEAEB] font-medium hover:bg-[#0d1685]">
              Login
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}