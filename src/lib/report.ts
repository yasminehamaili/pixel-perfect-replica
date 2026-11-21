/**
 * Report builder. Turns what the backend already produced (dashboard KPIs, one AI-written
 * Markdown report per department, market news) into the sections shown in the Report overlay
 * and written by the Export button. Pure and synchronous: no placeholder text, no fake latency.
 */
import { format } from "date-fns";

import type { DepartmentId } from "@/config/workspace";
import type { TranslationKey } from "@/i18n/dictionary";
import {
  BACKEND_DEPARTMENTS,
  BACKEND_TO_ROUTE,
  resolveBackendDepartment,
  type BackendDepartmentKey,
  type DashboardData,
  type DashboardKpi,
  type NewsArticle,
} from "@/lib/api";
import type { DateRange } from "@/lib/date-range";
import { formatKpiValue, formatPct, KPI_STATUS_KEY, kpiStatus, toNumber } from "@/lib/kpi";

export type ReportTag = "kpi" | "data";

export type ReportRow = {
  id: string;
  tag: ReportTag;
  label: string;
  value: string;
  detail?: string;
};

export type ReportSection = {
  id: string;
  title: string;
  rows: ReportRow[];
  /** AI-written Markdown, rendered under the rows. */
  body?: string;
  /** The AI text for this section is still being generated. */
  pending?: boolean;
};

export type Report = {
  department: DepartmentId;
  dateRange: DateRange;
  generatedAt: Date;
  sections: ReportSection[];
};

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export type ReportInput = {
  department: DepartmentId;
  dateRange: DateRange;
  dashboard: DashboardData;
  /** AI reports keyed by backend department (sales, production, stock, procurement, finance). */
  reports: Record<string, string>;
  news: NewsArticle[];
  /** True while the backend is still writing the AI reports. */
  aiPending: boolean;
  /** Number format locale, e.g. "en-US" or "fr-FR". */
  locale: string;
};

// ---------------------------------------------------------------------------
// Splitting the AI Markdown into sections
// ---------------------------------------------------------------------------

const KNOWN_TITLES = [
  "executive summary",
  "key figures",
  "analysis",
  "risks",
  "market context",
  "recommendations",
];

const cleanTitle = (raw: string) =>
  raw
    .replace(/^#+\s*/, "")
    .replace(/\*+/g, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/:\s*$/, "")
    .trim();

function headingTitle(line: string): string | null {
  const md = /^#{1,3}\s+(.+?)\s*#*$/.exec(line);
  return md?.[1] ? cleanTitle(md[1]) : null;
}

/** Fallback for models that write "1. Executive summary" or "**Key figures**" instead of # headings. */
function plainTitle(line: string): string | null {
  const m = /^\s*(?:\d+[.)]\s*)?(?:\*\*)?([A-Za-zÀ-ÿ][^*|]{2,60}?)(?:\*\*)?:?\s*$/.exec(line);
  const title = m?.[1] ? cleanTitle(m[1]) : "";
  if (!title) return null;
  const lower = title.toLowerCase();
  return KNOWN_TITLES.some((k) => lower.startsWith(k)) ? title : null;
}

function splitBy(lines: string[], titleOf: (line: string) => string | null) {
  const marks: { index: number; title: string }[] = [];
  lines.forEach((line, index) => {
    const title = titleOf(line);
    if (title) marks.push({ index, title });
  });
  return marks;
}

export function splitReportMarkdown(markdown: string, fallbackTitle: string): { title: string; body: string }[] {
  const text = markdown.replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  const lines = text.split("\n");

  let marks = splitBy(lines, headingTitle);
  if (marks.length < 2) marks = splitBy(lines, plainTitle);
  if (marks.length < 2) return [{ title: fallbackTitle, body: text }];

  const sections: { title: string; body: string }[] = [];
  const preamble = lines.slice(0, marks[0]!.index).join("\n").trim();
  if (preamble) sections.push({ title: fallbackTitle, body: preamble });

  marks.forEach((mark, i) => {
    const end = marks[i + 1]?.index ?? lines.length;
    const body = lines.slice(mark.index + 1, end).join("\n").trim();
    if (body) sections.push({ title: mark.title, body });
  });
  return sections.length > 0 ? sections : [{ title: fallbackTitle, body: text }];
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

function kpiRow(kpi: DashboardKpi, id: string, t: Translate, locale: string): ReportRow {
  const parts: string[] = [];
  const pct = formatPct(kpi.change_pct, locale);
  if (pct) parts.push(t("reportPanel.vsPrevious", { pct }));
  if (toNumber(kpi.target_value) !== null) {
    parts.push(t("reportPanel.target", { value: formatKpiValue(kpi.target_value, kpi.unit, locale) }));
  }
  parts.push(t(KPI_STATUS_KEY[kpiStatus(kpi)]));
  if (kpi.period) parts.push(kpi.period);
  if (kpi.source === "calculated" && kpi.formula) parts.push(t("reportPanel.formula", { formula: kpi.formula }));
  return {
    id,
    tag: "kpi",
    label: kpi.label,
    value: formatKpiValue(kpi.value, kpi.unit, locale),
    detail: parts.join(" · "),
  };
}

const listRows = (prefix: string, items: string[]): ReportRow[] =>
  items.map((text, i) => ({ id: `${prefix}-${i}`, tag: "data", label: text, value: "" }));

function newsRows(news: NewsArticle[]): ReportRow[] {
  return news.slice(0, 8).map((a, i) => ({
    id: `news-${i}`,
    tag: "data" as const,
    label: a.title,
    value: [a.source, a.date?.slice(0, 10)].filter(Boolean).join(" · ") || "—",
    ...(a.description ? { detail: a.description } : {}),
  }));
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export function buildReport(input: ReportInput, t: Translate): Report {
  const { department, dateRange, dashboard, reports, news, aiPending, locale } = input;
  const key = resolveBackendDepartment(department);
  const sections: ReportSection[] = [];
  const add = (section: ReportSection) => {
    if (section.rows.length > 0 || section.body || section.pending) sections.push(section);
  };

  if (dashboard.summary) {
    add({
      id: "summary",
      title: t("reportPanel.summary"),
      rows: [
        {
          id: "summary-text",
          tag: "data",
          label: dashboard.document_title || "—",
          value: dashboard.reporting_period ?? "—",
          detail: dashboard.summary,
        },
      ],
    });
  }

  if (key) {
    const dept = dashboard.departments[key];
    add({
      id: "kpis",
      title: t("reportPanel.keyIndicators"),
      rows: dept.kpis.map((k, i) => kpiRow(k, `kpi-${i}`, t, locale)),
    });

    const aiText = reports[key];
    if (aiText) {
      splitReportMarkdown(aiText, t("reportPanel.analysis")).forEach((s, i) =>
        add({ id: `ai-${i}`, title: s.title, rows: [], body: s.body }),
      );
    } else if (aiPending) {
      add({ id: "ai-pending", title: t("reportPanel.analysis"), rows: [], pending: true });
    } else {
      add({
        id: "ai-missing",
        title: t("reportPanel.analysis"),
        rows: [{ id: "ai-missing-row", tag: "data", label: t("reportPanel.noAi"), value: "—" }],
      });
    }

    const alerts = (dashboard.risks_or_alerts ?? []).filter((a) => a.department?.toLowerCase().includes(key));
    add({
      id: "alerts",
      title: t("reportPanel.alerts"),
      rows: alerts.map((a, i) => ({
        id: `alert-${i}`,
        tag: "data" as const,
        label: a.message,
        value: t(`dash.severity.${a.severity}` as TranslationKey),
      })),
    });
    add({ id: "insights", title: t("reportPanel.insights"), rows: listRows("insight", dept.insights) });
    add({ id: "gaps", title: t("reportPanel.gaps"), rows: listRows("gap", dept.data_gaps) });
  } else {
    const cross = dashboard.cross_department ?? { kpis: [], insights: [] };
    add({
      id: "cross-kpis",
      title: t("reportPanel.crossIndicators"),
      rows: cross.kpis.map((k, i) => kpiRow(k, `cross-${i}`, t, locale)),
    });
    add({
      id: "alerts",
      title: t("reportPanel.alerts"),
      rows: (dashboard.risks_or_alerts ?? []).map((a, i) => ({
        id: `alert-${i}`,
        tag: "data" as const,
        label: a.message,
        value: `${a.department} · ${t(`dash.severity.${a.severity}` as TranslationKey)}`,
      })),
    });
    add({ id: "insights", title: t("reportPanel.insights"), rows: listRows("insight", cross.insights) });

    // One block per department: the executive summary of its AI report.
    for (const dk of BACKEND_DEPARTMENTS as readonly BackendDepartmentKey[]) {
      const text = reports[dk];
      const title = t(`nav.${BACKEND_TO_ROUTE[dk]}` as TranslationKey);
      if (text) {
        const first = splitReportMarkdown(text, title)[0];
        if (first) add({ id: `ai-${dk}`, title, rows: [], body: first.body });
      } else if (aiPending) {
        add({ id: `ai-${dk}`, title, rows: [], pending: true });
      }
    }
  }

  add({ id: "news", title: t("reportPanel.news"), rows: newsRows(news) });

  return { department, dateRange, generatedAt: new Date(), sections };
}

/** Markdown used by the Export button. */
export function reportToMarkdown(report: Report, title: string, period: string): string {
  const lines: string[] = [
    `# ${title}`,
    "",
    `- Period: ${period}`,
    `- Generated: ${format(report.generatedAt, "yyyy-MM-dd HH:mm")}`,
    "",
  ];
  for (const section of report.sections) {
    lines.push(`## ${section.title}`, "");
    for (const row of section.rows) {
      const tag = `[${row.tag.toUpperCase()}]`;
      lines.push(row.value ? `- **${tag} ${row.label}:** ${row.value}` : `- **${tag}** ${row.label}`);
      if (row.detail) lines.push(`  ${row.detail}`);
    }
    if (section.rows.length > 0) lines.push("");
    if (section.body) {
      // Keep AI headings below the section heading.
      lines.push(section.body.replace(/^(#{1,5})(\s)/gm, "#$1$2"), "");
    }
  }
  return lines.join("\n");
}

export function reportFileName(department: DepartmentId, range: DateRange): string {
  return `northstar-${department}-${format(range.from, "yyyyMMdd")}-${format(range.to, "yyyyMMdd")}.md`;
}
