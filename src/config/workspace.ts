import type { LucideIcon } from "lucide-react";
import { BarChart3, Boxes, Factory, LayoutGrid, Truck, Wallet } from "lucide-react";

/** Department ids double as URL segments: /overview, /sales, ... */
export const DEPARTMENT_IDS = ["overview", "sales", "production", "stock", "supply", "finance"] as const;
export type DepartmentId = (typeof DEPARTMENT_IDS)[number];

export const DEPARTMENT_ICONS: Record<DepartmentId, LucideIcon> = {
  overview: LayoutGrid,
  sales: BarChart3,
  production: Factory,
  stock: Boxes,
  supply: Truck,
  finance: Wallet,
};

export function isDepartmentId(value: string): value is DepartmentId {
  return (DEPARTMENT_IDS as readonly string[]).includes(value);
}

/** Required inputs listed under "Data readiness" and in the Import dialog. */
export const REQUIRED_FILE_IDS = ["salesDemand", "stockLevels"] as const;
export type RequiredFileId = (typeof REQUIRED_FILE_IDS)[number];
export type FileStatus = "uploaded" | "missing";

/** Mock: initial upload status of the required inputs. */
export const INITIAL_FILE_STATUS: Record<RequiredFileId, FileStatus> = {
  salesDemand: "uploaded",
  stockLevels: "missing",
};

/** Mock signed-in user. */
export const MOCK_USER = {
  name: "Yasmine Hamaili",
  email: "yasmine@northstar.app",
  initials: "YH",
};

/** Mock: departments the current user can open. */
export const ACCESSIBLE_DEPARTMENTS: readonly DepartmentId[] = DEPARTMENT_IDS;

/**
 * DEV: set to true to preview the "Not accessible." state on every department,
 * or to a department id to preview it on that department only.
 */
export const DEV_PREVIEW_INACCESSIBLE: boolean | DepartmentId = false;

export function isDepartmentAccessible(id: DepartmentId): boolean {
  if (DEV_PREVIEW_INACCESSIBLE === true || DEV_PREVIEW_INACCESSIBLE === id) return false;
  return ACCESSIBLE_DEPARTMENTS.includes(id);
}

/** Placeholder — replace with the user's real API key. */
export const API_KEY_PLACEHOLDER = "ns_live_7f3a9c2e5b1d4f8a6c0e2b9d1f7a3c5e";

/** Has the user unread notifications (shows the 6px dot on the bell). */
export const HAS_UNREAD_NOTIFICATIONS = true;
