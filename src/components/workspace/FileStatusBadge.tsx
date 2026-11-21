import { CircleAlert, CircleCheck } from "lucide-react";

import type { FileStatus } from "@/config/workspace";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export function FileStatusBadge({ status }: { status: FileStatus }) {
  const t = useT();
  const uploaded = status === "uploaded";
  const Icon = uploaded ? CircleCheck : CircleAlert;
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-pill px-2 text-xs font-medium",
        uploaded ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {uploaded ? t("file.uploaded") : t("file.missing")}
    </span>
  );
}
