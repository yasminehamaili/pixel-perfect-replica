export type KpiStatus = "good" | "warning" | "critical" | "neutral";

export type DashboardKpi = {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  period: string | null;
  source: "reported" | "calculated";
  formula: string | null;
  previous_value: number | null;
  change_pct: number | null;
  target_value: number | null;
  status: KpiStatus;
  confidence: "high" | "medium" | "low";
};

export type ChartSeries = {
  name: string;
  data: { label: string; value: number }[];
};

export type DashboardChart = {
  id: string;
  title: string;
  type: "line" | "bar" | "stacked_bar" | "donut" | "waterfall" | "scatter" | "gauge" | "table";
  x_label: string | null;
  y_label: string | null;
  unit: string | null;
  series: ChartSeries[];
  why_it_matters: string;
};

export type DepartmentData = {
  kpis: DashboardKpi[];
  charts: DashboardChart[];
  insights: string[];
  data_gaps: string[];
};

export type BackendDepartmentKey = "sales" | "production" | "stock" | "procurement" | "finance";

export type DashboardData = {
  document_title: string;
  document_date: string | null;
  reporting_period: string | null;
  currency: string | null;
  summary: string;
  departments: Record<BackendDepartmentKey, DepartmentData>;
  cross_department?: {
    kpis: DashboardKpi[];
    insights: string[];
  };
  entities?: {
    products: string[];
    suppliers: string[];
    customers: string[];
    channels: string[];
    regions: string[];
  };
  risks_or_alerts?: {
    department: string;
    severity: "high" | "medium" | "low";
    message: string;
  }[];
};

export type UploadedDocument = {
  id: string;
  filename: string;
  dashboard: DashboardData;
};

export type NewsArticle = {
  title: string;
  source?: string;
  date?: string;
  description?: string;
  url?: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/** Maps frontend route department slugs to the 5 backend schema keys. */
export function resolveBackendDepartment(department: string): BackendDepartmentKey | null {
  const d = department.toLowerCase();
  if (d.includes("sale") || d.includes("vente") || d.includes("commercial")) return "sales";
  if (d.includes("prod") || d.includes("manufact") || d.includes("ops")) return "production";
  if (d.includes("stock") || d.includes("invent") || d.includes("warehous")) return "stock";
  if (d.includes("procur") || d.includes("purchas") || d.includes("supply") || d.includes("achat")) return "procurement";
  if (d.includes("financ") || d.includes("account") || d.includes("compta")) return "finance";
  return null;
}

export async function uploadDocument(file: File): Promise<UploadedDocument> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/documents`, {
    method: "POST",
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  return data as UploadedDocument;
}

export async function generateReports(
  docId: string,
  industry = "beverage industry",
): Promise<{ reports: Record<string, string>; news: NewsArticle[] }> {
  const res = await fetch(`${API_BASE}/documents/${docId}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ industry }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Report generation failed (${res.status})`);
  }
  return data;
}

export async function sendChatMessage(
  docId: string,
  message: string,
  history: ChatMessage[],
): Promise<string> {
  const res = await fetch(`${API_BASE}/documents/${docId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Chat request failed (${res.status})`);
  }
  return data.answer as string;
}