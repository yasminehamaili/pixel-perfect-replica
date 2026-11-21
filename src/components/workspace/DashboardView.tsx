import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  FileUp,
  Info,
  Lightbulb,
  Loader2,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type DepartmentId } from "@/config/workspace";
import {
  resolveBackendDepartment,
  type DashboardChart,
  type DashboardKpi,
  type KpiStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useWorkspace } from "./WorkspaceProvider";

const STATUS_STYLES: Record<KpiStatus, string> = {
  good: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
  neutral: "border-border bg-muted text-muted-foreground",
};

function formatKpiValue(value: number | null, unit: string) {
  if (value === null || value === undefined) return "—";
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.abs(value) < 10 ? 2 : 1,
  }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const isPositive = (kpi.change_pct ?? 0) >= 0;

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardDescription className="text-xs font-medium text-muted-foreground">
            {kpi.label}
          </CardDescription>
          <Badge variant="outline" className={cn("text-[10px] capitalize", STATUS_STYLES[kpi.status])}>
            {kpi.status}
          </Badge>
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {formatKpiValue(kpi.value, kpi.unit)}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-0 text-xs text-muted-foreground">
        {kpi.change_pct !== null && kpi.change_pct !== undefined ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
            )}
          >
            {isPositive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {isPositive ? "+" : ""}
            {kpi.change_pct.toFixed(1)}%
          </span>
        ) : (
          <span>{kpi.period || "Current period"}</span>
        )}
        <span className="text-[11px] opacity-80" title={kpi.formula || undefined}>
          {kpi.source === "calculated" ? "Calculated" : "Reported"}
        </span>
      </CardContent>
    </Card>
  );
}

function ChartCard({ chart }: { chart: DashboardChart }) {
  const primarySeries = chart.series?.[0]?.data ?? [];
  const maxVal = Math.max(...primarySeries.map((d) => Math.abs(d.value)), 1);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{chart.title}</CardTitle>
          <Badge variant="secondary" className="text-[10px] uppercase">
            {chart.type.replace("_", " ")}
          </Badge>
        </div>
        {chart.why_it_matters && (
          <CardDescription className="text-xs">{chart.why_it_matters}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        {primarySeries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No chart data points available.</p>
        ) : chart.type === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1.5 font-medium">{chart.x_label || "Item"}</th>
                  {chart.series.map((s) => (
                    <th key={s.name} className="py-1.5 text-right font-medium">
                      {s.name} {chart.unit ? `(${chart.unit})` : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {primarySeries.map((point, idx) => (
                  <tr key={point.label + idx} className="border-b last:border-0">
                    <td className="py-1.5 font-medium">{point.label}</td>
                    {chart.series.map((s) => (
                      <td key={s.name} className="py-1.5 text-right tabular-nums">
                        {s.data[idx]?.value?.toLocaleString() ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-2.5">
            {primarySeries.map((point, idx) => {
              const pct = Math.min(100, Math.max(4, (Math.abs(point.value) / maxVal) * 100));
              return (
                <div key={point.label + idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium">{point.label}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {point.value.toLocaleString()} {chart.unit || ""}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardView({
  department,
  onOpenImport,
}: {
  department: DepartmentId;
  onOpenImport: () => void;
}) {
  const { doc, uploading, reports, reportsLoading } = useWorkspace();

  if (uploading) {
    return (
      <section className="flex min-h-[380px] flex-col items-center justify-center gap-3 rounded-xl border bg-card/60 p-8 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <h2 className="text-base font-semibold">Extracting KPIs & building dashboard...</h2>
        <p className="max-w-md text-xs text-muted-foreground">
          The LLM is analyzing your document across Sales, Production, Stock, Procurement, and Finance.
        </p>
      </section>
    );
  }

  if (!doc) {
    return (
      <section className="flex min-h-[380px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card/60 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BarChart3 className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold">No document analyzed yet</h2>
          <p className="max-w-md text-xs text-muted-foreground">
            Import a PDF, DOCX, CSV, or TXT business report to populate department KPIs, charts, AI reports, and the assistant chatbot.
          </p>
        </div>
        <Button onClick={onOpenImport}>
          <FileUp className="mr-2 size-4" />
          Import Document
        </Button>
      </section>
    );
  }

  const { dashboard } = doc;
  const backendKey = resolveBackendDepartment(department);
  const deptData = backendKey ? dashboard.departments?.[backendKey] : null;

  // Fallback to cross-department + combined KPIs if on an overview/unmapped route
  const kpis: DashboardKpi[] = deptData
    ? deptData.kpis
    : [
        ...(dashboard.cross_department?.kpis ?? []),
        ...Object.values(dashboard.departments ?? {}).flatMap((d) => d.kpis.slice(0, 2)),
      ];

  const charts: DashboardChart[] = deptData
    ? deptData.charts
    : Object.values(dashboard.departments ?? {}).flatMap((d) => d.charts.slice(0, 1));

  const insights = deptData
    ? deptData.insights
    : dashboard.cross_department?.insights ?? [];

  const dataGaps = deptData?.data_gaps ?? [];
  const alerts = (dashboard.risks_or_alerts ?? []).filter(
    (a) => !backendKey || a.department.toLowerCase().includes(backendKey),
  );
  const deptReport = backendKey ? reports[backendKey] : undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* Executive Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">{dashboard.document_title || doc.filename}</CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Source: {doc.filename}
                {dashboard.reporting_period ? ` · Period: ${dashboard.reporting_period}` : ""}
                {dashboard.currency ? ` · Currency: ${dashboard.currency}` : ""}
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1 text-xs">
              <Sparkles className="size-3 text-primary" />
              {reportsLoading ? "Generating AI reports..." : "AI Ready"}
            </Badge>
          </div>
        </CardHeader>
        {dashboard.summary && (
          <CardContent className="pt-0 text-sm leading-relaxed text-muted-foreground">
            {dashboard.summary}
          </CardContent>
        )}
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid gap-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs",
                alert.severity === "high"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
              )}
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <span className="font-semibold uppercase">{alert.department}: </span>
                {alert.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Grid */}
      {kpis.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center text-xs text-muted-foreground">
          No KPIs were found for this department in <strong>{doc.filename}</strong>.
        </Card>
      )}

      {/* Charts Grid */}
      {charts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {charts.map((chart) => (
            <ChartCard key={chart.id} chart={chart} />
          ))}
        </div>
      )}

      {/* Insights & Data Gaps */}
      {(insights.length > 0 || dataGaps.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {insights.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lightbulb className="size-4 text-primary" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1.5 pl-4 text-xs text-muted-foreground">
                  {insights.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {dataGaps.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Info className="size-4 text-muted-foreground" />
                  Missing Data / Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1.5 pl-4 text-xs text-muted-foreground">
                  {dataGaps.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* AI Generated Department Report Preview */}
      {deptReport && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">AI Analyst Report</CardTitle>
            <CardDescription className="text-xs">
              Generated from document KPIs and recent market news
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/40 p-4 text-xs leading-relaxed">
              {deptReport}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}