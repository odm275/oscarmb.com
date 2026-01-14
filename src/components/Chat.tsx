"use client";

import { useChatbot } from "@/contexts/ChatContext";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/Accordion";

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, setMessages, status, error } = useChat();

  const isLoading = status === "streaming" || status === "submitted";

  const { isVisible } = useChatbot();

  const handleSubmit = (message: string) => {
    sendMessage({ text: message });
  };

  return (
    isVisible && (
      <Accordion type="single" collapsible className="relative z-40 flex">
        <AccordionItem
          value="item-1"
          className="fixed bottom-4 right-4 w-[320px] rounded-lg border bg-background shadow-lg shadow-black/10 sm:bottom-8 sm:right-8 sm:w-96 dark:shadow-black/30"
        >
          <AccordionTrigger className="border-b px-6">
            <ChatHeader />
          </AccordionTrigger>
          <AccordionContent className="flex max-h-[400px] min-h-[350px] flex-col justify-between rounded-b-lg p-0 sm:max-h-[500px] sm:min-h-[400px]">
            <ChatMessages
              messages={messages}
              error={error}
              isLoading={isLoading}
              onPromptClick={(prompt) => setInput(prompt)}
            />
            <ChatInput
              input={input}
              onInputChange={setInput}
              onSend={handleSubmit}
              setMessages={setMessages}
              isLoading={isLoading}
              messages={messages}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
  );
}
