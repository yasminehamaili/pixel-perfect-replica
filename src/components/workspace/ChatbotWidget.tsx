import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageSquare, Send, Trash2, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      {/* Floating Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI Assistant"
        className="fixed bottom-6 right-6 z-[9998] inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <MessageSquare className="size-5" />
        AI Assistant
      </button>

      {/* Backdrop + Slide-Over Drawer */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l bg-background shadow-2xl">
            <div className="flex items-start justify-between border-b px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Bot className="size-5 text-primary" />
                  AI Business Assistant
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {doc
                    ? `Connected to ${doc.filename} · ${department}`
                    : "Import a document first to ask questions about your KPIs."}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {chatMessages.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={clearChat}
                    title="Clear conversation"
                    className="size-8"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="size-8"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {!doc ? (
                <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-center text-xs text-muted-foreground">
                  Upload a document from the workspace to start chatting.
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Ask anything about the extracted KPIs, reports, or market news:
                  </p>
                  <div className="flex flex-col gap-2">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => void handleSend(q)}
                        className="cursor-pointer rounded-lg border bg-card px-3 py-2 text-left text-xs transition-colors hover:bg-accent"
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
          </aside>
        </div>
      )}
    </>
  );
}