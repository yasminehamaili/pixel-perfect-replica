import { AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, FileText, FileUp, Info, Lightbulb, Loader2, Sparkles } from "lucide-react";

import { Markdown } from "@/components/docs/Markdown";
import { Button } from "@/components/ui/button";
import { type DepartmentId } from "@/config/workspace";
import { useLanguage, useT } from "@/i18n/I18nProvider";
import { resolveBackendDepartment, type DashboardChart, type DashboardKpi } from "@/lib/api";
import { formatKpiValue, formatPct, KPI_STATUS_CLASS, KPI_STATUS_KEY, kpiStatus, toNumber } from "@/lib/kpi";
import { splitReportMarkdown } from "@/lib/report";
import { cn } from "@/lib/utils";
import { useWorkspace } from "./WorkspaceProvider";

/** Same footprint as the dashboard placeholder in the design: fixed height, 900px column. */
const PANEL = "h-(--layout-dashboard) rounded-xl border bg-card/60";
const GRID = "grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(210px,1fr))]";
const CARD = "rounded-xl border bg-card p-4 shadow-card";

function KpiCard({ kpi, locale }: { kpi: DashboardKpi; locale: string }) {
  const t = useT();
  const status = kpiStatus(kpi);
  const pct = formatPct(kpi.change_pct, locale);
  const change = toNumber(kpi.change_pct) ?? 0;

  return (
    <div className={cn(CARD, "flex flex-col justify-between gap-3")}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
        <span
          className={cn(
            "inline-flex h-5 shrink-0 items-center rounded-sm px-1.5 text-[10px] font-semibold uppercase tracking-wider",
            KPI_STATUS_CLASS[status],
          )}
        >
          {t(KPI_STATUS_KEY[status])}
        </span>
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">
        {formatKpiValue(kpi.value, kpi.unit, locale)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        {pct ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              change >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {change >= 0 ? (
              <ArrowUpRight className="size-3.5" aria-hidden />
            ) : (
              <ArrowDownRight className="size-3.5" aria-hidden />
            )}
            {pct}
          </span>
        ) : (
          <span>{kpi.period || t("dash.currentPeriod")}</span>
        )}
        <span title={kpi.formula || undefined}>
          {kpi.source === "calculated" ? t("dash.calculated") : t("dash.reported")}
        </span>
      </div>
    </div>
  );
}

function ChartCard({ chart, locale }: { chart: DashboardChart; locale: string }) {
  const t = useT();
  const points = chart.series[0]?.data ?? [];
  const max = Math.max(...points.map((d) => Math.abs(toNumber(d.value) ?? 0)), 1);
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

  return (
    <div className={cn(CARD, "flex flex-col gap-3")}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug">{chart.title}</h3>
        <span className="inline-flex h-5 shrink-0 items-center rounded-sm bg-tag-data px-1.5 text-[10px] font-semibold uppercase tracking-wider text-tag-data-foreground">
          {chart.type.replace("_", " ")}
        </span>
      </div>
      {chart.why_it_matters && <p className="text-xs text-muted-foreground">{chart.why_it_matters}</p>}

      {points.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("dash.noChartData")}</p>
      ) : chart.type === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-1.5 font-medium">{chart.x_label || t("dash.item")}</th>
                {chart.series.map((s) => (
                  <th key={s.name} className="py-1.5 text-right font-medium">
                    {s.name}
                    {chart.unit ? ` (${chart.unit})` : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {points.map((point, i) => (
                <tr key={`${point.label}-${i}`} className="border-b last:border-0">
                  <td className="py-1.5 font-medium">{point.label}</td>
                  {chart.series.map((s) => {
                    const v = toNumber(s.data[i]?.value);
                    return (
                      <td key={s.name} className="py-1.5 text-right tabular-nums">
                        {v === null ? "—" : number.format(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2.5">
          {points.map((point, i) => {
            const v = toNumber(point.value) ?? 0;
            const width = Math.min(100, Math.max(4, (Math.abs(v) / max) * 100));
            return (
              <div key={`${point.label}-${i}`} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium">{point.label}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {number.format(v)} {chart.unit || ""}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-pill bg-muted">
                  <div className="h-full rounded-pill bg-primary" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ListCard({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Lightbulb;
  title: string;
  items: string[];
}) {
  return (
    <section className={CARD}>
      <h3 className="eyebrow mb-3 flex items-center gap-2">
        <Icon className="size-3.5" aria-hidden />
        {title}
      </h3>
      <ul className="list-disc space-y-1.5 pl-4 text-sm text-foreground/90 marker:text-muted-foreground">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function DashboardView({
  department,
  onOpenImport,
  onOpenReport,
}: {
  department: DepartmentId;
  onOpenImport: () => void;
  onOpenReport: () => void;
}) {
  const t = useT();
  const { language } = useLanguage();
  const { doc, uploading, reports, reportsLoading, reportsError } = useWorkspace();
  const locale = language === "fr" ? "fr-FR" : "en-US";

  if (uploading) {
    return (
      <section
        aria-label={t("dashboard.placeholder")}
        aria-busy="true"
        className={cn(PANEL, "flex flex-col items-center justify-center gap-3 p-8 text-center")}
      >
        <Loader2 className="size-8 animate-spin text-foreground" aria-hidden />
        <h2 className="text-base font-semibold">{t("dash.analyzingTitle")}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{t("dash.analyzingBody")}</p>
      </section>
    );
  }

  if (!doc) {
    return (
      <section
        aria-label={t("dashboard.placeholder")}
        className={cn(PANEL, "flex flex-col items-center justify-center gap-4 border-dashed p-8 text-center")}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-card shadow-card">
          <BarChart3 className="size-6 text-primary" aria-hidden />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{t("dash.emptyTitle")}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{t("dash.emptyBody")}</p>
        </div>
        <Button onClick={onOpenImport}>
          <FileUp aria-hidden />
          {t("dash.import")}
        </Button>
      </section>
    );
  }

  const { dashboard } = doc;
  const key = resolveBackendDepartment(department);
  const dept = key ? dashboard.departments[key] : null;

  const kpis: DashboardKpi[] = dept
    ? dept.kpis
    : [
        ...(dashboard.cross_department?.kpis ?? []),
        ...Object.values(dashboard.departments).flatMap((d) => d.kpis.slice(0, 2)),
      ];
  const charts: DashboardChart[] = dept
    ? dept.charts
    : Object.values(dashboard.departments).flatMap((d) => d.charts.slice(0, 1));
  const insights = dept ? dept.insights : (dashboard.cross_department?.insights ?? []);
  const gaps = dept?.data_gaps ?? [];
  const alerts = (dashboard.risks_or_alerts ?? []).filter(
    (a) => !key || a.department?.toLowerCase().includes(key),
  );

  const aiText = key ? reports[key] : undefined;
  const aiSummary = aiText ? splitReportMarkdown(aiText, t("dash.aiReport"))[0] : undefined;

  const meta = [
    `${t("dash.source")}: ${doc.filename}`,
    dashboard.reporting_period ? `${t("dash.period")}: ${dashboard.reporting_period}` : null,
    dashboard.currency ? `${t("dash.currency")}: ${dashboard.currency}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const aiState = reportsLoading
    ? { label: t("dash.aiGenerating"), className: "bg-muted text-muted-foreground", icon: Loader2, spin: true }
    : reportsError
      ? { label: t("dash.aiFailed"), className: "bg-warning-soft text-warning", icon: AlertTriangle, spin: false }
      : { label: t("dash.aiReady"), className: "bg-success-soft text-success", icon: Sparkles, spin: false };
  const AiIcon = aiState.icon;

  return (
    <section aria-label={t("dashboard.placeholder")} className={cn(PANEL, "overflow-y-auto p-5")}>
      <div className="flex flex-col gap-5">
        <header className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight">{dashboard.document_title || doc.filename}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
            </div>
            <span
              className={cn(
                "inline-flex h-6 shrink-0 items-center gap-1 rounded-pill px-2 text-xs font-medium",
                aiState.className,
              )}
            >
              <AiIcon className={cn("size-3.5", aiState.spin && "animate-spin")} aria-hidden />
              {aiState.label}
            </span>
          </div>
          {dashboard.summary && <p className="text-sm leading-relaxed text-muted-foreground">{dashboard.summary}</p>}
        </header>

        {alerts.length > 0 && (
          <section aria-label={t("dash.alerts")} className="grid gap-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm",
                  alert.severity === "high"
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-warning/40 bg-warning-soft text-warning",
                )}
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div>
                  <span className="font-semibold uppercase">{alert.department}: </span>
                  {alert.message}
                </div>
              </div>
            ))}
          </section>
        )}

        <section>
          <h3 className="eyebrow mb-2">{t("dash.kpis")}</h3>
          {kpis.length > 0 ? (
            <div className={GRID}>
              {kpis.map((kpi, i) => (
                <KpiCard key={`${i}-${kpi.id}`} kpi={kpi} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("dash.noKpis", { file: doc.filename })}
            </p>
          )}
        </section>

        {charts.length > 0 && (
          <section>
            <h3 className="eyebrow mb-2">{t("dash.charts")}</h3>
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
              {charts.map((chart, i) => (
                <ChartCard key={`${i}-${chart.id}`} chart={chart} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {(insights.length > 0 || gaps.length > 0) && (
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {insights.length > 0 && <ListCard icon={Lightbulb} title={t("dash.insights")} items={insights} />}
            {gaps.length > 0 && <ListCard icon={Info} title={t("dash.gaps")} items={gaps} />}
          </div>
        )}

        {aiSummary && (
          <section className={CARD}>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="eyebrow">{t("dash.aiReport")}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t("dash.aiReportBody")}</p>
              </div>
              <Button variant="toolbar" size="sm" onClick={onOpenReport}>
                <FileText aria-hidden />
                {t("dash.openReport")}
              </Button>
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg border bg-background px-5 py-1 text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <Markdown content={aiSummary.body} />
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
