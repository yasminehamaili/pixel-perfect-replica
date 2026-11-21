import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export function BillingOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");

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

          <img
            src={period === "monthly" ? "/pricing-mensuel.jpg" : "/pricing-annuel.jpg"}
            alt={period === "monthly" ? t("billing.monthly") : t("billing.annual")}
            className="mx-auto block max-h-[calc(92vh-100px)] w-full max-w-[1000px] rounded-lg object-contain"
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
