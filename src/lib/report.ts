/**
 * Report generation — the plug-in point for the AI.
 * Replace the body of `generateReport` with a real call; keep the return shape.
 */
import { format } from "date-fns";

import type { DepartmentId } from "@/config/workspace";
import type { DateRange } from "@/lib/date-range";

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
};

export type Report = {
  department: DepartmentId;
  dateRange: DateRange;
  generatedAt: Date;
  /** True while the content is placeholder text, not AI output. */
  placeholder: boolean;
  sections: ReportSection[];
};

const PLACEHOLDER = "[PLACEHOLDER]";

export async function generateReport(department: DepartmentId, dateRange: DateRange): Promise<Report> {
  // Simulated latency so the loading skeleton is visible. Remove when wiring the AI.
  await new Promise((resolve) => setTimeout(resolve, 900));

  return {
    department,
    dateRange,
    generatedAt: new Date(),
    placeholder: true,
    sections: [
      {
        id: "summary",
        title: `${PLACEHOLDER} Summary`,
        rows: [
          {
            id: "summary-headline",
            tag: "kpi",
            label: `${PLACEHOLDER} Headline metric`,
            value: "—",
            detail: "AI-generated summary of the period goes here.",
          },
          {
            id: "summary-sources",
            tag: "data",
            label: `${PLACEHOLDER} Sources used`,
            value: "Sales Demand, Stock Levels",
          },
        ],
      },
      {
        id: "kpis",
        title: `${PLACEHOLDER} Key indicators`,
        rows: [
          { id: "kpi-1", tag: "kpi", label: `${PLACEHOLDER} Indicator 1`, value: "—" },
          { id: "kpi-2", tag: "kpi", label: `${PLACEHOLDER} Indicator 2`, value: "—" },
          { id: "kpi-3", tag: "kpi", label: `${PLACEHOLDER} Indicator 3`, value: "—" },
        ],
      },
      {
        id: "data",
        title: `${PLACEHOLDER} Data notes`,
        rows: [
          {
            id: "data-1",
            tag: "data",
            label: `${PLACEHOLDER} Data observation`,
            value: "—",
            detail: "Notes about completeness or anomalies in the imported files.",
          },
          { id: "data-2", tag: "data", label: `${PLACEHOLDER} Data observation`, value: "—" },
        ],
      },
    ],
  };
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
      lines.push(`- **[${row.tag.toUpperCase()}] ${row.label}:** ${row.value}`);
      if (row.detail) lines.push(`  ${row.detail}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function reportFileName(department: DepartmentId, range: DateRange): string {
  return `northstar-${department}-${format(range.from, "yyyyMMdd")}-${format(range.to, "yyyyMMdd")}.md`;
}
