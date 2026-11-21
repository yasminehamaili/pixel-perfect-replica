import { Bell, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HAS_UNREAD_NOTIFICATIONS, MOCK_USER, type DepartmentId } from "@/config/workspace";
import { useLanguage, useT } from "@/i18n/I18nProvider";
import { formatRange, getPreviousPeriod } from "@/lib/date-range";
import { DateRangePicker } from "./DateRangePicker";
import { useWorkspace } from "./WorkspaceProvider";

export function TopNav({
  department,
  accessible,
  onReimport,
  onOpenAccount,
}: {
  department: DepartmentId;
  accessible: boolean;
  onReimport: () => void;
  onOpenAccount: () => void;
}) {
  const t = useT();
  const { dateLocale } = useLanguage();
  const { dateRange } = useWorkspace();

  return (
    <header className="sticky top-0 z-20 flex h-(--layout-topbar) shrink-0 items-center gap-3 border-b bg-background/90 px-(--layout-gutter) backdrop-blur">
      {accessible && (
        <>
          <h1 className="shrink-0 text-lg font-semibold tracking-tight">{t(`nav.${department}`)}</h1>
          <DateRangePicker />
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            {t("top.vsPrevious", { range: formatRange(getPreviousPeriod(dateRange), dateLocale) })}
          </p>
        </>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {accessible && (
          <Button variant="toolbar" size="toolbar" onClick={onReimport}>
            <Upload aria-hidden />
            {t("top.reimport")}
          </Button>
        )}
        <button
          type="button"
          aria-label={HAS_UNREAD_NOTIFICATIONS ? `${t("top.notifications")} — ${t("top.unread")}` : t("top.notifications")}
          className="relative flex size-(--layout-bell) items-center justify-center rounded-full border border-border bg-card text-foreground shadow-card transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="size-[18px]" aria-hidden />
          {HAS_UNREAD_NOTIFICATIONS && (
            <span
              aria-hidden
              className="absolute right-[11px] top-[11px] size-(--layout-dot) rounded-full bg-destructive ring-2 ring-card"
            />
          )}
        </button>
        <button
          type="button"
          onClick={onOpenAccount}
          aria-label={t("top.openAccount")}
          className="flex size-(--layout-bell) items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden"
        >
          {MOCK_USER.initials}
        </button>
      </div>
    </header>
  );
}
