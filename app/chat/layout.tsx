import "../globals.css";
import type { Metadata } from "next";
import { Header } from "@/components/sections/header";

export const metadata: Metadata = {
  title: "Context Memory Layer",
  description: "The AI-powered context memory system for chatbots and developers.",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
    </>
  );
}
