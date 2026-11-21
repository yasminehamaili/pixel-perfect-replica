import type { TranslationKey } from "@/i18n/dictionary";
import type { DashboardKpi, KpiStatus } from "@/lib/api";

/** The model sometimes returns numbers as strings ("12.5") or omits them. */
export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function formatKpiValue(value: unknown, unit: string | null | undefined, locale = "en-US"): string {
  const n = toNumber(value);
  if (n === null) return "—";
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: Math.abs(n) < 10 ? 2 : 1 }).format(n);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatPct(value: unknown, locale = "en-US"): string | null {
  const n = toNumber(value);
  if (n === null) return null;
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(n);
  return `${formatted}%`;
}

const STATUSES: readonly KpiStatus[] = ["good", "warning", "critical", "neutral"];

export function kpiStatus(kpi: Pick<DashboardKpi, "status">): KpiStatus {
  return (STATUSES as readonly string[]).includes(kpi.status) ? kpi.status : "neutral";
}

export const KPI_STATUS_KEY: Record<KpiStatus, TranslationKey> = {
  good: "dash.status.good",
  warning: "dash.status.warning",
  critical: "dash.status.critical",
  neutral: "dash.status.neutral",
};

/** Design-system tokens only (see styles.css): success / warning / destructive / muted. */
export const KPI_STATUS_CLASS: Record<KpiStatus, string> = {
  good: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  critical: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};
