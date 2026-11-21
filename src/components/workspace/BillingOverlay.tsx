import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUpRight, Check, X } from "lucide-react";

import { PLANS, type BillingPeriod, type Plan } from "@/config/pricing";
import { useLanguage, useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

type Translate = ReturnType<typeof useT>;

function PlanCard({
  plan,
  period,
  t,
  formatNumber,
}: {
  plan: Plan;
  period: BillingPeriod;
  t: Translate;
  formatNumber: (value: number) => string;
}) {
  const name = t(plan.nameKey);
  const parent = plan.extendsPlan ? PLANS.find((p) => p.id === plan.extendsPlan) : undefined;
  const price = period === "monthly" ? plan.monthlyPrice : plan.annualPrice;

  return (
    <section
      aria-labelledby={`plan-${plan.id}-name`}
      className={cn(
        "flex flex-col rounded-xl border bg-card p-5 shadow-card",
        plan.highlighted && "border-ring ring-2 ring-ring",
      )}
    >
      {plan.highlighted && (
        <span className="mb-2 inline-flex w-fit rounded-pill bg-tag-kpi px-3 py-1 text-xs font-medium text-tag-kpi-foreground">
          {t("billing.popular")}
        </span>
      )}
      <h3 id={`plan-${plan.id}-name`} className="text-xl font-semibold text-foreground">
        {name}
      </h3>
      <p className="mt-1 min-h-[3rem] text-sm text-muted-foreground">{t(plan.descriptionKey)}</p>

      <p className="mt-5 text-3xl font-bold tracking-tight text-foreground">{formatNumber(price)} DZD</p>
      <p className="mt-1 min-h-[2.5rem] text-sm text-muted-foreground">
        {period === "monthly"
          ? t("billing.perMonth")
          : t("billing.perYear", { monthly: formatNumber(Math.round(plan.annualPrice / 12)) })}
      </p>

      <button
        type="button"
        className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t("billing.choose", { plan: name })}
        <ArrowUpRight className="size-4" aria-hidden />
      </button>

      <p className="mt-5 text-sm font-semibold text-foreground">
        {parent ? t("billing.everythingIn", { plan: t(parent.nameKey) }) : t("billing.includes")}
      </p>
      <ul className="mt-3 space-y-3">
        {plan.featureKeys.map((key) => (
          <li key={key} className="flex items-start gap-3 text-sm text-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BillingOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const { language } = useLanguage();
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const formatNumber = (value: number) =>
    new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(value);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(1080px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-4 shadow-pop sm:p-5",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        >
          <DialogPrimitive.Title className="sr-only">{t("billing.title")}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{t("billing.title")}</DialogPrimitive.Description>

          <DialogPrimitive.Close
            aria-label={t("billing.close")}
            className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-card transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </DialogPrimitive.Close>

          <div className="mb-4 flex justify-center pr-10">
            <div className="inline-flex h-12 items-center gap-1 rounded-lg border bg-background p-1 shadow-card">
              <button
                type="button"
                onClick={() => setPeriod("monthly")}
                className={cn(
                  "h-10 rounded-md px-5 text-sm font-semibold transition-colors",
                  period === "monthly"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {t("billing.monthly")}
              </button>
              <button
                type="button"
                onClick={() => setPeriod("annual")}
                className={cn(
                  "h-10 rounded-md px-5 text-sm font-semibold transition-colors",
                  period === "annual"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {t("billing.annual")}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} period={period} t={t} formatNumber={formatNumber} />
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
