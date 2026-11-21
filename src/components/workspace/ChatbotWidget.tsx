import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageSquare, Send, Trash2, User } from "lucide-react";

import { Markdown } from "@/components/docs/Markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { type DepartmentId } from "@/config/workspace";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useWorkspace } from "./WorkspaceProvider";

/** Chat bubbles reuse the docs Markdown renderer, tightened for a narrow panel. */
const BUBBLE_MARKDOWN =
  "[&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:leading-6 [&_p]:leading-6 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 " +
  "[&_h1]:mb-2 [&_h1]:text-base [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:border-0 [&_h2]:pt-0 [&_h2]:text-sm [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-sm";

export function ChatbotWidget({ department }: { department: DepartmentId }) {
  const t = useT();
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

  const quickPrompts = [t("chat.prompt1"), t("chat.prompt2"), t("chat.prompt3")];

  return (
    <>
      {/* Clears the account sidebar on wide screens, sits in the corner otherwise. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex h-11 cursor-pointer items-center gap-2 rounded-pill bg-primary px-5 text-sm font-medium text-primary-foreground shadow-pop transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:right-[calc(var(--layout-account)+var(--layout-gutter))]"
      >
        <MessageSquare className="size-4" aria-hidden />
        {t("chat.open")}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <div className="border-b px-5 py-4 pr-12">
            <SheetTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <Bot className="size-5" aria-hidden />
              {t("chat.title")}
            </SheetTitle>
            <SheetDescription className="mt-0.5 text-xs">
              {doc
                ? t("chat.connected", { file: doc.filename, department: t(`nav.${department}`) })
                : t("chat.needDoc")}
            </SheetDescription>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {!doc ? (
              <div className="rounded-lg border border-dashed bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                {t("chat.needDoc")}
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t("chat.intro")}</p>
                <div className="flex flex-col gap-2">
                  {quickPrompts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void handleSend(q)}
                      className="cursor-pointer rounded-lg border bg-card px-3.5 py-2.5 text-left text-sm shadow-card transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card">
                      <Bot className="size-4" aria-hidden />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
                      msg.role === "user"
                        ? "whitespace-pre-wrap bg-primary text-primary-foreground"
                        : "border bg-card shadow-card",
                    )}
                  >
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <div className={BUBBLE_MARKDOWN}>
                        <Markdown content={msg.content} />
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <User className="size-4" aria-hidden />
                    </div>
                  )}
                </div>
              ))
            )}

            {chatLoading && (
              <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-foreground" aria-hidden />
                {t("chat.thinking")}
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
            {chatMessages.length > 0 && (
              <Button
                type="button"
                variant="toolbar"
                size="icon"
                onClick={clearChat}
                title={t("chat.clear")}
                aria-label={t("chat.clear")}
              >
                <Trash2 aria-hidden />
              </Button>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={doc ? t("chat.placeholder") : t("chat.placeholderLocked")}
              disabled={!doc || chatLoading}
              className="text-sm"
            />
            <Button type="submit" size="icon" disabled={!doc || !input.trim() || chatLoading} aria-label={t("chat.send")}>
              <Send aria-hidden />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
