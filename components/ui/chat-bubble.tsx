import React from "react";

interface ChatBubbleProps {
  role: "user" | "ai";
  content: string;
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";
  return (
    <div
      className={`w-fit max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? "bg-blue-600 text-white self-end ml-auto"
          : "bg-neutral-800 text-neutral-100 self-start"
      }`}
    >
      {content}
    </div>
  );
}
