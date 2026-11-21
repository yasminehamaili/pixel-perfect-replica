import { useState } from "react";
import { CreditCard, FileSpreadsheet, LogOut, UserRound } from "lucide-react";

import { MOCK_USER, REQUIRED_FILE_IDS, type DepartmentId } from "@/config/workspace";
import { useLanguage, useT } from "@/i18n/I18nProvider";
import { formatRange } from "@/lib/date-range";
import { cn } from "@/lib/utils";
import { BillingOverlay } from "./BillingOverlay";
import { FileStatusBadge } from "./FileStatusBadge";
import { useWorkspace } from "./WorkspaceProvider";

const rowClass =
  "flex h-10 w-full items-center gap-3 rounded-md px-2.5 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function AccountSidebar({ department, className }: { department: DepartmentId; className?: string }) {
  const t = useT();
  const { dateLocale } = useLanguage();
  const { dateRange, files } = useWorkspace();
  const [billingOpen, setBillingOpen] = useState(false);
  const departmentName = t(`nav.${department}`);

  return (
    <>
      <aside
        aria-label={t("account.title")}
        className={cn("flex w-(--layout-account) shrink-0 flex-col gap-6 overflow-y-auto bg-sidebar px-4 py-5", className)}
      >
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex size-(--layout-avatar) shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
        >
          {MOCK_USER.initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{MOCK_USER.name}</div>
          <div className="truncate text-xs text-muted-foreground">{MOCK_USER.email}</div>
        </div>
      </div>

      <section>
        <h2 className="eyebrow mb-2">{t("account.workspaceContext")}</h2>
        <dl className="space-y-2.5 rounded-lg border bg-card p-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">{t("account.department")}</dt>
            <dd className="font-medium">{departmentName}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("account.reportingPeriod")}</dt>
            <dd className="font-medium">{formatRange(dateRange, dateLocale)}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="eyebrow mb-1">{t("account.dataReadiness")}</h2>
        <p className="mb-2 text-xs text-muted-foreground">
          {t("account.requiredInputs", { department: departmentName })}
        </p>
        <ul className="space-y-2">
          {REQUIRED_FILE_IDS.map((id) => (
            <li key={id} className="flex items-start gap-2.5 rounded-lg border bg-card p-3">
              <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                <span className="truncate text-sm font-medium">{t(`file.${id}`)}</span>
                <FileStatusBadge status={files[id]} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-auto">
        <h2 className="eyebrow mb-1">{t("account.section")}</h2>
        <div className="flex flex-col">
          <button type="button" className={rowClass}>
            <UserRound className="size-4 text-muted-foreground" aria-hidden />
            {t("account.settings")}
          </button>
          <button type="button" onClick={() => setBillingOpen(true)} className={rowClass}>
            <CreditCard className="size-4 text-muted-foreground" aria-hidden />
            {t("account.billing")}
          </button>
          <button type="button" className={cn(rowClass, "text-destructive hover:bg-destructive/10")}>
            <LogOut className="size-4" aria-hidden />
            {t("account.signOut")}
          </button>
        </div>
      </section>
      </aside>
      <BillingOverlay open={billingOpen} onOpenChange={setBillingOpen} />
    </>
  );
}
