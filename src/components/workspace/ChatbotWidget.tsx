import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageSquare, Send, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { type DepartmentId } from "@/config/workspace";
import { cn } from "@/lib/utils";
import { useWorkspace } from "./WorkspaceProvider";

const QUICK_PROMPTS = [
  "Summarize the biggest risks in this document",
  "Which KPIs are performing below target?",
  "How does market news affect our margins?",
];

export function ChatbotWidget({ department }: { department: DepartmentId }) {
  const { doc, chatMessages, chatLoading, sendChat, clearChat } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const handleSend = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || !doc || chatLoading) return;
    setInput("");
    await sendChat(query);
  };

  return (
    <>
      {/* Floating Chatbot Button */}
      <Button
        type="button"
        size="lg"
        onClick={() => setOpen(true)}
        aria-label="Open AI Assistant"
        className="fixed bottom-6 right-6 z-40 h-12 rounded-full px-4 shadow-lg"
      >
        <MessageSquare className="mr-2 size-5" />
        AI Assistant
      </Button>

      {/* Slide-over Chatbot Panel */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b px-5 py-4">
            <div className="flex items-center justify-between pr-6">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Bot className="size-5 text-primary" />
                AI Business Assistant
              </SheetTitle>
              {chatMessages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  title="Clear conversation"
                  className="size-8"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
            <SheetDescription className="text-xs">
              {doc
                ? `Connected to ${doc.filename} · ${department}`
                : "Import a document first to ask questions about your KPIs and reports."}
            </SheetDescription>
          </SheetHeader>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {!doc ? (
              <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-center text-xs text-muted-foreground">
                Upload a document from the workspace to start chatting with the AI assistant.
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Ask anything about the extracted KPIs, department reports, or market context:
                </p>
                <div className="flex flex-col gap-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void handleSend(q)}
                      className="rounded-lg border bg-card px-3 py-2 text-left text-xs transition-colors hover:bg-accent"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2.5 text-xs",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="size-3.5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[82%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border bg-muted/50 text-foreground",
                    )}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <User className="size-3.5" />
                    </div>
                  )}
                </div>
              ))
            )}

            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                Thinking...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex items-center gap-2 border-t p-4"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={doc ? "Ask about KPIs, trends, or risks..." : "Upload a document first..."}
              disabled={!doc || chatLoading}
              className="text-xs"
            />
            <Button type="submit" size="icon" disabled={!doc || !input.trim() || chatLoading}>
              <Send className="size-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}