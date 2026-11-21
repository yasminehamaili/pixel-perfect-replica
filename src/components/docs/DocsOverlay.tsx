import { useEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, ChevronRight, PanelLeft, Search, X } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DOC_GROUPS, DOC_PAGES, extractToc, searchDocs } from "@/docs";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Markdown } from "./Markdown";

export function DocsOverlay({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT();
  const [slug, setSlug] = useState(DOC_PAGES[0]?.slug ?? "");
  const [query, setQuery] = useState("");
  const [treeOpen, setTreeOpen] = useState(true);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const index = Math.max(0, DOC_PAGES.findIndex((p) => p.slug === slug));
  const page = DOC_PAGES[index];
  const prev = DOC_PAGES[index - 1];
  const next = DOC_PAGES[index + 1];
  const toc = useMemo(() => (page ? extractToc(page.content) : []), [page]);
  const matches = useMemo(() => new Set(searchDocs(query).map((p) => p.slug)), [query]);

  // Ctrl/Cmd+K focuses search while the overlay is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (nextSlug: string) => {
    setSlug(nextSlug);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  useEffect(() => {
    setActiveHeading(toc[0]?.id ?? null);
  }, [toc]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    let current: string | null = toc[0]?.id ?? null;
    el.querySelectorAll<HTMLElement>("[data-toc]").forEach((h) => {
      if (h.getBoundingClientRect().top - top <= 96) current = h.id;
    });
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) current = toc.at(-1)?.id ?? current;
    setActiveHeading(current);
  };

  const scrollToHeading = (id: string) => {
    const el = scrollRef.current;
    const target = el?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (el && target) {
      el.scrollTo({ top: target.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - 24, behavior: "smooth" });
    }
  };

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col bg-background text-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        >
          <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
            <button
              type="button"
              onClick={() => setTreeOpen((v) => !v)}
              aria-label={t("docs.toggleTree")}
              aria-expanded={treeOpen}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PanelLeft className="size-4" aria-hidden />
            </button>
            <div className="flex items-center gap-2">
              <div aria-hidden className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                N
              </div>
              <DialogPrimitive.Title className="text-sm font-bold tracking-[0.12em]">
                {t("brand.name")} <span className="font-medium tracking-normal text-muted-foreground">{t("docs.title")}</span>
              </DialogPrimitive.Title>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const first = DOC_PAGES.find((p) => matches.has(p.slug));
                    if (first) go(first.slug);
                  }
                }}
                placeholder={t("docs.search")}
                aria-label={t("docs.search")}
                className="h-9 w-full rounded-lg border border-input bg-muted/60 pl-9 pr-16 text-sm placeholder:text-muted-foreground focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {isMac ? "⌘" : "Ctrl"} K
              </kbd>
            </div>

            <DialogPrimitive.Close
              aria-label={t("docs.close")}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden />
            </DialogPrimitive.Close>
          </header>

          <div className="flex min-h-0 flex-1">
            {treeOpen && (
              <nav aria-label={t("docs.title")} className="w-(--layout-docs-tree) shrink-0 overflow-y-auto border-r px-3 py-5">
                {DOC_GROUPS.map((group) => {
                  const pages = group.pages.filter((p) => matches.has(p.slug));
                  if (pages.length === 0) return null;
                  return (
                    <Collapsible key={group.title} defaultOpen className="mb-4">
                      <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" aria-hidden />
                        {group.title}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ul className="mt-1 space-y-0.5 border-l pl-2 ml-3.5">
                          {pages.map((p) => (
                            <li key={p.slug}>
                              <button
                                type="button"
                                onClick={() => go(p.slug)}
                                aria-current={p.slug === slug ? "page" : undefined}
                                data-active={p.slug === slug}
                                className="w-full rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground"
                              >
                                {p.title}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
                {matches.size === 0 && (
                  <p className="px-2 text-sm text-muted-foreground">{t("docs.noResults", { query })}</p>
                )}
              </nav>
            )}

            <div ref={scrollRef} onScroll={onScroll} className="min-w-0 flex-1 overflow-y-auto">
              <div className="mx-auto flex max-w-[calc(var(--layout-docs-article)+var(--layout-docs-toc)+4rem)] gap-10 px-8 py-10">
                <article className="min-w-0 max-w-(--layout-docs-article) flex-1">
                  {page && <Markdown key={page.slug} content={page.content} />}

                  <div className="mt-12 grid grid-cols-2 gap-4 border-t pt-6">
                    {prev ? (
                      <button
                        type="button"
                        onClick={() => go(prev.slug)}
                        className="flex flex-col items-start gap-1 rounded-lg border p-4 text-left hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ArrowLeft className="size-3.5" aria-hidden />
                          {t("docs.previous")}
                        </span>
                        <span className="text-sm font-medium">{prev.title}</span>
                      </button>
                    ) : (
                      <span />
                    )}
                    {next && (
                      <button
                        type="button"
                        onClick={() => go(next.slug)}
                        className="col-start-2 flex flex-col items-end gap-1 rounded-lg border p-4 text-right hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          {t("docs.next")}
                          <ArrowRight className="size-3.5" aria-hidden />
                        </span>
                        <span className="text-sm font-medium">{next.title}</span>
                      </button>
                    )}
                  </div>
                </article>

                {toc.length > 0 && (
                  <aside className="sticky top-10 hidden h-fit w-(--layout-docs-toc) shrink-0 xl:block">
                    <div className="eyebrow mb-3">{t("docs.onThisPage")}</div>
                    <ul className="space-y-1 border-l text-sm">
                      {toc.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => scrollToHeading(item.id)}
                            data-active={activeHeading === item.id}
                            className={cn(
                              "-ml-px block w-full border-l py-1 pr-2 text-left text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              "border-transparent data-[active=true]:border-primary data-[active=true]:font-medium data-[active=true]:text-primary",
                              item.level === 3 ? "pl-6" : "pl-3",
                            )}
                          >
                            {item.text}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </aside>
                )}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
