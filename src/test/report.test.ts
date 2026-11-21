import { describe, expect, it } from "vitest";

import { generateReport, reportFileName, reportToMarkdown } from "@/lib/report";

const range = { from: new Date(2026, 10, 1), to: new Date(2026, 10, 21) };

describe("report export", () => {
  it("exports every section and tags rows as KPI or DATA in Markdown", async () => {
    const report = await generateReport("sales", range);
    const md = reportToMarkdown(report, "Report — Sales", "Nov 1 – Nov 21, 2026");
    expect(md.startsWith("# Report — Sales")).toBe(true);
    for (const s of report.sections) expect(md).toContain(`## ${s.title}`);
    expect(md).toContain("[KPI]");
    expect(md).toContain("[DATA]");
  });
  it("names the file after department and period", () => {
    expect(reportFileName("sales", range)).toBe("northstar-sales-20261101-20261121.md");
  });
});
