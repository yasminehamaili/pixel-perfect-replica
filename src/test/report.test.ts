import { describe, expect, it } from "vitest";

import type { DashboardData, DashboardKpi } from "@/lib/api";
import { normalizeDashboard } from "@/lib/api";
import { translate } from "@/i18n/dictionary";
import { buildReport, reportFileName, reportToMarkdown, splitReportMarkdown } from "@/lib/report";

const range = { from: new Date(2026, 10, 1), to: new Date(2026, 10, 21) };
const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate("en", key, vars);

const kpi = (over: Partial<DashboardKpi> = {}): DashboardKpi => ({
  id: "gross_margin_pct",
  label: "Gross margin",
  value: 31.5,
  unit: "%",
  period: "Q3 2026",
  source: "calculated",
  formula: "(revenue - cogs) / revenue",
  previous_value: 30,
  change_pct: 5,
  target_value: 33,
  status: "warning",
  confidence: "high",
  ...over,
});

const dashboard: DashboardData = normalizeDashboard({
  document_title: "Q3 report",
  document_date: null,
  reporting_period: "Q3 2026",
  currency: "EUR",
  summary: "Sales grew while stock coverage shrank.",
  departments: {
    sales: { kpis: [kpi()], charts: [], insights: ["Volume up 5%"], data_gaps: ["No channel split"] },
  } as unknown as DashboardData["departments"],
  risks_or_alerts: [{ department: "sales", severity: "high", message: "Top customer churn risk" }],
});

const AI_REPORT = [
  "# Sales report",
  "",
  "## 1. Executive summary",
  "Sales are up.",
  "",
  "## 2. Key figures",
  "| KPI | Value |",
  "| --- | --- |",
  "| Gross margin | 31.5 % |",
  "",
  "## 6. Recommendations",
  "- Protect the top customer.",
].join("\n");

const base = { department: "sales" as const, dateRange: range, dashboard, news: [], locale: "en-US" };

describe("splitReportMarkdown", () => {
  it("splits on headings, drops numbering and the empty title", () => {
    const parts = splitReportMarkdown(AI_REPORT, "AI analysis");
    expect(parts.map((p) => p.title)).toEqual(["Executive summary", "Key figures", "Recommendations"]);
    expect(parts[1]!.body).toContain("| KPI | Value |");
  });
  it("understands numbered plain-text titles", () => {
    const parts = splitReportMarkdown("1. Executive summary\nAll good.\n2. Key figures\nA table.", "AI analysis");
    expect(parts.map((p) => p.title)).toEqual(["Executive summary", "Key figures"]);
  });
  it("keeps unstructured text as one section", () => {
    expect(splitReportMarkdown("Just a paragraph.", "AI analysis")).toEqual([
      { title: "AI analysis", body: "Just a paragraph." },
    ]);
  });
});

describe("buildReport", () => {
  it("uses the real KPIs and the AI report instead of placeholder text", () => {
    const report = buildReport({ ...base, reports: { sales: AI_REPORT }, aiPending: false }, t);
    const titles = report.sections.map((s) => s.title);
    expect(titles).toEqual(
      expect.arrayContaining(["Summary", "Key indicators", "Executive summary", "Recommendations", "Alerts", "Insights"]),
    );
    const kpiRow = report.sections.find((s) => s.id === "kpis")!.rows[0]!;
    expect(kpiRow.value).toBe("31.5 %");
    expect(kpiRow.detail).toContain("Target 33 %");
    expect(JSON.stringify(report)).not.toContain("PLACEHOLDER");
  });
  it("shows a pending AI section while reports are generated, and a notice if they failed", () => {
    const pending = buildReport({ ...base, reports: {}, aiPending: true }, t);
    expect(pending.sections.find((s) => s.id === "ai-pending")?.pending).toBe(true);
    const failed = buildReport({ ...base, reports: {}, aiPending: false }, t);
    expect(failed.sections.find((s) => s.id === "ai-missing")).toBeDefined();
  });
  it("maps the Supply route to the backend procurement report", () => {
    const report = buildReport(
      { ...base, department: "supply", reports: { procurement: "## Executive summary\nSuppliers fine." }, aiPending: false },
      t,
    );
    expect(report.sections.some((s) => s.body?.includes("Suppliers fine."))).toBe(true);
  });
  it("copes with a model that returned numbers as strings", () => {
    const messy = normalizeDashboard({
      ...dashboard,
      departments: {
        ...dashboard.departments,
        sales: { ...dashboard.departments.sales, kpis: [kpi({ value: "12.5" as unknown as number, change_pct: "3" as unknown as number })] },
      },
    });
    const report = buildReport({ ...base, dashboard: messy, reports: {}, aiPending: false }, t);
    expect(report.sections.find((s) => s.id === "kpis")!.rows[0]!.value).toBe("12.5 %");
  });
});

describe("report export", () => {
  it("exports every section and tags rows as KPI or DATA in Markdown", () => {
    const report = buildReport({ ...base, reports: { sales: AI_REPORT }, aiPending: false }, t);
    const md = reportToMarkdown(report, "Report — Sales", "Nov 1 – Nov 21, 2026");
    expect(md.startsWith("# Report — Sales")).toBe(true);
    for (const s of report.sections) expect(md).toContain(`## ${s.title}`);
    expect(md).toContain("[KPI]");
    expect(md).toContain("[DATA]");
    expect(md).toContain("| Gross margin | 31.5 % |");
  });
  it("names the file after department and period", () => {
    expect(reportFileName("sales", range)).toBe("northstar-sales-20261101-20261121.md");
  });
});
