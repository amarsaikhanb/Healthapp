"use client";

import { useState, FormEvent } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatWithAparvi } from "@/app/actions/session";

export default function PatientRecordsPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { id: number; role: "user" | "assistant"; content: string }[]
  >([]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: "user" as const,
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    await chatWithAparvi();
  }

  return (
    <div className="p-8 space-y-6">
      <DashboardHeader
        title="My Medical Records"
        description="Ask about your sessions and documents"
      />

      <div className="flex w-full h-[700px] flex-col bg-white text-black">
        {/* Chat header */}
        <div className="border-b border-neutral-300 px-4 py-3 text-sm font-medium">
          Chat with your assistant
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <div
                  className={
                    msg.role === "user"
                      ? "max-w-[75%] rounded-2xl bg-black px-3 py-2 text-sm text-white"
                      : "max-w-[75%] rounded-2xl border border-neutral-300 px-3 py-2 text-sm text-black"
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input area */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-neutral-300 px-3 py-3"
        >
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your visits, notes, or documents..."
              className="min-h-[60px] w-full resize-none border-neutral-400 bg-white text-black placeholder:text-neutral-400 focus-visible:ring-neutral-800"
            />
            <Button
              type="submit"
              className="h-[60px] rounded-xl bg-black px-4 text-sm font-medium text-white hover:bg-neutral-900"
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
