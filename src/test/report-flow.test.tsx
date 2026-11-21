import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardView } from "@/components/workspace/DashboardView";
import { ReportOverlay } from "@/components/workspace/ReportOverlay";
import { WorkspaceProvider, useWorkspace } from "@/components/workspace/WorkspaceProvider";
import { I18nProvider } from "@/i18n/I18nProvider";

const DASHBOARD = {
  document_title: "Q3 report",
  document_date: null,
  reporting_period: "Q3 2026",
  currency: "EUR",
  summary: "Sales grew while stock coverage shrank.",
  departments: {
    sales: {
      kpis: [
        {
          id: "revenue", label: "Revenue", value: 1250000, unit: "EUR", period: "Q3 2026", source: "reported",
          formula: null, previous_value: 1200000, change_pct: 4.2, target_value: 1300000, status: "warning", confidence: "high",
        },
      ],
      charts: [],
      insights: ["Volume up 4%"],
      data_gaps: [],
    },
  },
  risks_or_alerts: [],
};

const REPORT = "## 1. Executive summary\nRevenue reached 1.25M EUR.\n\n## 2. Recommendations\n- Protect the top customer.";

function UploadButton() {
  const { uploadAndAnalyze } = useWorkspace();
  return <button onClick={() => void uploadAndAnalyze(new File(["x".repeat(80)], "q3.txt"))}>upload</button>;
}

function Harness({ reportOpen = true }: { reportOpen?: boolean }) {
  return (
    <I18nProvider>
      <WorkspaceProvider>
        <UploadButton />
        <DashboardView department="sales" onOpenImport={() => {}} onOpenReport={() => {}} />
        <ReportOverlay open={reportOpen} onOpenChange={() => {}} department="sales" onOpenImport={() => {}} />
      </WorkspaceProvider>
    </I18nProvider>
  );
}

const json = (body: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);

describe("report flow", () => {
  let reportsOk = true;

  beforeEach(() => {
    reportsOk = true;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.endsWith("/documents")) return json({ id: "doc-1", filename: "q3.txt", dashboard: DASHBOARD });
        if (url.endsWith("/reports")) {
          return reportsOk
            ? json({ reports: { sales: REPORT }, news: [{ title: "Sugar prices rise", source: "Reuters", date: "2026-11-10T00:00:00Z" }] })
            : json({ error: "Document not found" }, 404);
        }
        return json({}, 404);
      }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("asks to import a document before anything is analysed", () => {
    render(<Harness />);
    expect(screen.getAllByText(/import a document to generate a report/i).length).toBeGreaterThan(0);
  });

  it("shows the real KPIs, AI report sections and news, not placeholder text", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("upload"));

    await waitFor(() => expect(screen.getAllByText("Executive summary").length).toBeGreaterThan(0));
    expect(screen.getAllByText("Recommendations").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Revenue").length).toBeGreaterThan(0);
    expect(screen.getByText("Sugar prices rise")).toBeInTheDocument();
    expect(screen.queryByText(/PLACEHOLDER/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export/i })).toBeEnabled();
  });

  it("explains a failed report and recovers on retry", async () => {
    reportsOk = false;
    render(<Harness />);
    fireEvent.click(screen.getByText("upload"));

    await screen.findByRole("alert");
    expect(screen.getByText("Document not found")).toBeInTheDocument();
    // The KPIs are still there even though the AI text failed.
    expect(screen.getAllByText("Revenue").length).toBeGreaterThan(0);

    reportsOk = true;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    });
    await waitFor(() => expect(screen.getAllByText("Executive summary").length).toBeGreaterThan(0));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
