"use client";

import { useChatbot } from "@/contexts/ChatContext";
import { ArrowDown, ArrowDownRight } from "lucide-react";

export default function HomeChatPrompt() {
  const { openChat } = useChatbot();

  return (
    <button
      type="button"
      onClick={openChat}
      className="text-foreground hover:text-primary focus-visible:ring-ring cursor-pointer rounded-full p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      aria-label="Open chat with Oscar AI"
    >
      <ArrowDownRight className="hidden size-5 animate-bounce sm:block" />
      <ArrowDown className="block size-5 animate-bounce sm:hidden" />
    </button>
  );
}
