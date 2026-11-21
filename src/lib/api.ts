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

const API_BASE = import.meta.env["VITE_API_URL"] || "http://localhost:3001/api";

export const BACKEND_DEPARTMENTS: readonly BackendDepartmentKey[] = [
  "sales",
  "production",
  "stock",
  "procurement",
  "finance",
];

/** Frontend route ids -> backend schema keys. `supply` is called `procurement` by the backend. */
const ROUTE_TO_BACKEND: Record<string, BackendDepartmentKey | null> = {
  overview: null,
  sales: "sales",
  production: "production",
  stock: "stock",
  supply: "procurement",
  finance: "finance",
};

/** Backend schema keys -> frontend route ids (used for labels). */
export const BACKEND_TO_ROUTE = {
  sales: "sales",
  production: "production",
  stock: "stock",
  procurement: "supply",
  finance: "finance",
} as const satisfies Record<BackendDepartmentKey, string>;

export function resolveBackendDepartment(department: string): BackendDepartmentKey | null {
  const d = department.toLowerCase();
  if (d in ROUTE_TO_BACKEND) return ROUTE_TO_BACKEND[d] ?? null;
  return (BACKEND_DEPARTMENTS as readonly string[]).includes(d) ? (d as BackendDepartmentKey) : null;
}

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

/**
 * The LLM output is not guaranteed to match the schema (missing arrays, null departments).
 * Fill in safe defaults once, so every view can read `.kpis.length` etc. without crashing.
 */
export function normalizeDashboard(raw: DashboardData): DashboardData {
  const departments = {} as Record<BackendDepartmentKey, DepartmentData>;
  for (const key of BACKEND_DEPARTMENTS) {
    const d = (raw?.departments?.[key] ?? {}) as Partial<DepartmentData>;
    departments[key] = {
      kpis: asArray<DashboardKpi>(d.kpis),
      charts: asArray<DashboardChart>(d.charts).map((c) => ({
        ...c,
        type: c.type ?? "bar",
        series: asArray<ChartSeries>(c.series).map((s) => ({ ...s, data: asArray(s.data) })),
      })),
      insights: asArray<string>(d.insights),
      data_gaps: asArray<string>(d.data_gaps),
    };
  }
  return {
    ...raw,
    document_title: raw?.document_title ?? "",
    document_date: raw?.document_date ?? null,
    reporting_period: raw?.reporting_period ?? null,
    currency: raw?.currency ?? null,
    summary: raw?.summary ?? "",
    departments,
    cross_department: {
      kpis: asArray<DashboardKpi>(raw?.cross_department?.kpis),
      insights: asArray<string>(raw?.cross_department?.insights),
    },
    risks_or_alerts: asArray<NonNullable<DashboardData["risks_or_alerts"]>[number]>(raw?.risks_or_alerts),
  };
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
  const uploaded = data as UploadedDocument;
  return { ...uploaded, dashboard: normalizeDashboard(uploaded.dashboard) };
}

export type GeneratedReports = {
  reports: Record<string, string>;
  news: NewsArticle[];
  /** Backend keys of departments whose report failed (the others still succeeded). */
  errors?: Record<string, string>;
};

export async function generateReports(
  docId: string,
  industry = "beverage industry",
): Promise<GeneratedReports> {
  const res = await fetch(`${API_BASE}/documents/${docId}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ industry }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Report generation failed (${res.status})`);
  }
  return {
    reports: data.reports && typeof data.reports === "object" ? data.reports : {},
    news: Array.isArray(data.news) ? data.news : [],
    errors: data.errors && typeof data.errors === "object" ? data.errors : {},
  };
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