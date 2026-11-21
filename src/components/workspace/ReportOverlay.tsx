import { useEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Download, FileUp, Loader2, Printer, X } from "lucide-react";

import { Markdown } from "@/components/docs/Markdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DepartmentId } from "@/config/workspace";
import type { TranslationKey } from "@/i18n/dictionary";
import { useLanguage, useT } from "@/i18n/I18nProvider";
import { BACKEND_TO_ROUTE, type BackendDepartmentKey } from "@/lib/api";
import { formatRange } from "@/lib/date-range";
import { buildReport, reportFileName, reportToMarkdown, type ReportTag } from "@/lib/report";
import { cn } from "@/lib/utils";
import { useWorkspace } from "./WorkspaceProvider";

function Tag({ tag }: { tag: ReportTag }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-sm px-1.5 text-[10px] font-semibold uppercase tracking-wider",
        tag === "kpi" ? "bg-tag-kpi text-tag-kpi-foreground" : "bg-tag-data text-tag-data-foreground",
      )}
    >
      {tag === "kpi" ? t("reportPanel.kpi") : t("reportPanel.data")}
    </span>
  );
}

export function ReportOverlay({
  open,
  onOpenChange,
  department,
  onOpenImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: DepartmentId;
  onOpenImport: () => void;
}) {
  const t = useT();
  const { dateLocale, language } = useLanguage();
  const { dateRange, doc, reports, news, reportsLoading, reportsError, reportErrors, retryReports } = useWorkspace();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const locale = language === "fr" ? "fr-FR" : "en-US";
  const report = useMemo(
    () =>
      doc
        ? buildReport(
            {
              department,
              dateRange,
              dashboard: doc.dashboard,
              reports,
              news,
              aiPending: reportsLoading,
              locale,
            },
            t,
          )
        : null,
    [doc, department, dateRange, reports, news, reportsLoading, locale, t],
  );

  const departmentName = t(`nav.${department}`);
  const period = formatRange(dateRange, dateLocale);
  const sections = report?.sections ?? [];
  const failedDepartments = Object.keys(reportErrors).map((key) =>
    t(`nav.${BACKEND_TO_ROUTE[key as BackendDepartmentKey] ?? "overview"}` as TranslationKey),
  );

  useEffect(() => {
    if (open) setActiveStep(0);
  }, [open, doc?.id]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nodes = Array.from(el.querySelectorAll<HTMLElement>("[data-report-section]"));
    let current = 0;
    nodes.forEach((node, i) => {
      if (node.offsetTop - el.offsetTop - el.scrollTop <= 24) current = i;
    });
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) current = Math.max(0, nodes.length - 1);
    setActiveStep(current);
  };

  const goToStep = (index: number) => {
    const el = scrollRef.current;
    const node = el?.querySelectorAll<HTMLElement>("[data-report-section]")[index];
    if (el && node) el.scrollTo({ top: node.offsetTop - el.offsetTop, behavior: "smooth" });
    setActiveStep(index);
  };

  const exportMarkdown = () => {
    if (!report) return;
    const md = reportToMarkdown(report, `${t("reportPanel.title")} — ${departmentName}`, period);
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = reportFileName(department, dateRange);
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export / Print wait for the AI text so the file is never half empty.
  const actionsDisabled = !report || reportsLoading;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="print-hide fixed inset-0 z-50 bg-overlay backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className={cn(
            "print-report fixed left-1/2 top-1/2 z-50 flex max-h-[min(86vh,820px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border bg-card text-card-foreground shadow-pop",
            "w-[min(clamp(var(--layout-report-min),72vw,var(--layout-report-max)),calc(100vw-2rem))]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        >
          <header className="flex items-start gap-4 border-b px-6 py-5">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">
                {t("reportPanel.title")}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                {departmentName} · {period}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              aria-label={t("reportPanel.close")}
              className="print-hide flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden />
            </DialogPrimitive.Close>
          </header>

          {report && sections.length > 0 && (
            <nav aria-label={t("reportPanel.steps")} className="print-hide border-b px-6 py-3">
              <ol className="flex flex-wrap items-center gap-2">
                {sections.map((section, i) => {
                  const active = i === activeStep;
                  return (
                    <li key={section.id} className="flex items-center gap-2">
                      {i > 0 && <span aria-hidden className="h-px w-5 bg-border" />}
                      <button
                        type="button"
                        onClick={() => goToStep(i)}
                        aria-current={active ? "step" : undefined}
                        data-active={active}
                        className="inline-flex h-7 items-center gap-2 rounded-pill bg-muted pl-1 pr-3 text-xs font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                      >
                        <span className="flex size-5 items-center justify-center rounded-full bg-card text-[11px] text-foreground">
                          {i + 1}
                        </span>
                        <span className="max-w-40 truncate">{section.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}

          <div ref={scrollRef} onScroll={onScroll} data-print-scroll className="flex-1 overflow-y-auto px-6 py-5">
            {!report ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <p className="max-w-sm text-sm text-muted-foreground">{t("reportPanel.empty")}</p>
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onOpenImport();
                  }}
                >
                  <FileUp aria-hidden />
                  {t("dash.import")}
                </Button>
              </div>
            ) : (
              <div className="space-y-7">
                {reportsLoading && (
                  <p
                    role="status"
                    className="print-hide flex items-center gap-2 rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground"
                  >
                    <Loader2 className="size-4 animate-spin text-foreground" aria-hidden />
                    {t("reportPanel.generating")}
                  </p>
                )}

                {reportsError && (
                  <div
                    role="alert"
                    className="print-hide flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{t("reportPanel.error")}</div>
                      <div className="mt-0.5 break-words text-xs">{reportsError}</div>
                    </div>
                    <Button variant="toolbar" size="sm" onClick={() => void retryReports()}>
                      {t("reportPanel.retry")}
                    </Button>
                  </div>
                )}

                {!reportsError && failedDepartments.length > 0 && (
                  <div
                    role="alert"
                    className="print-hide flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning"
                  >
                    <div className="min-w-0 flex-1">
                      {t("reportPanel.partial", { departments: failedDepartments.join(", ") })}
                    </div>
                    <Button variant="toolbar" size="sm" onClick={() => void retryReports()}>
                      {t("reportPanel.retry")}
                    </Button>
                  </div>
                )}

                {sections.map((section) => (
                  <section key={section.id} data-report-section aria-labelledby={`report-${section.id}`}>
                    <h3 id={`report-${section.id}`} className="eyebrow mb-3">
                      {section.title}
                    </h3>

                    {section.pending && (
                      <div aria-busy="true" aria-label={t("reportPanel.loading")} className="space-y-2">
                        {[0, 1].map((r) => (
                          <div key={r} className="flex items-center gap-3 rounded-lg border p-4">
                            <Skeleton className="h-5 w-10" />
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    )}

                    {section.rows.length > 0 && (
                      <ul className="space-y-2">
                        {section.rows.map((row) => (
                          <li key={row.id} className="flex items-start gap-3 rounded-lg border bg-background p-4">
                            <Tag tag={row.tag} />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium">{row.label}</div>
                              {row.detail && <p className="mt-1 text-sm text-muted-foreground">{row.detail}</p>}
                            </div>
                            {row.value && (
                              <div className="shrink-0 text-sm font-semibold tabular-nums">{row.value}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.body && (
                      <div className="rounded-lg border bg-background px-5 py-1 text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <Markdown content={section.body} />
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
          </div>

          <footer className="print-hide flex justify-end gap-2 border-t px-6 py-4">
            <Button variant="toolbar" size="toolbar" onClick={exportMarkdown} disabled={actionsDisabled}>
              <Download aria-hidden />
              {t("reportPanel.export")}
            </Button>
            <Button size="toolbar" onClick={() => window.print()} disabled={actionsDisabled}>
              <Printer aria-hidden />
              {t("reportPanel.print")}
            </Button>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
