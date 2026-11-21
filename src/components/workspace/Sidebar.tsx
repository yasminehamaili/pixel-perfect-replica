import { Link } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";

import { DEPARTMENT_ICONS, DEPARTMENT_IDS, type DepartmentId } from "@/config/workspace";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { SettingsMenu } from "./SettingsMenu";

export const footerRowClass =
  "flex h-(--layout-footer-row) w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground";

export function Sidebar({
  department,
  onOpenDocs,
}: {
  department: DepartmentId;
  onOpenDocs: () => void;
}) {
  const t = useT();

  return (
    <aside className="sticky top-0 flex h-screen w-(--layout-sidebar) shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-(--layout-topbar) items-center gap-3 px-5">
        <div
          aria-hidden
          className="flex size-(--layout-logo) items-center justify-center rounded-md bg-primary text-base font-bold text-primary-foreground"
        >
          N
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-[0.12em]">{t("brand.name")}</div>
          <div className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground">
            {t("brand.subtitle")}
          </div>
        </div>
      </div>

      <nav aria-label={t("nav.primary")} className="flex-1 overflow-y-auto px-3 pt-4">
        <div className="eyebrow px-3 pb-2">{t("nav.section")}</div>
        <ul className="flex flex-col gap-1">
          {DEPARTMENT_IDS.map((id) => {
            const Icon = DEPARTMENT_ICONS[id];
            const active = id === department;
            return (
              <li key={id}>
                <Link
                  to="/$department"
                  params={{ department: id }}
                  aria-current={active ? "page" : undefined}
                  data-active={active}
                  className={cn(
                    "flex h-(--layout-nav-item) items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-[18px] shrink-0" aria-hidden />
                  {t(`nav.${id}`)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <button type="button" className={footerRowClass}>
          <LifeBuoy className="size-[18px]" aria-hidden />
          {t("nav.helpCenter")}
        </button>
        <SettingsMenu onOpenDocs={onOpenDocs} />
      </div>
    </aside>
  );
}
