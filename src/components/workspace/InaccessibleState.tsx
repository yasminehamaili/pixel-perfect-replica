import { TriangleAlert } from "lucide-react";

import { useT } from "@/i18n/I18nProvider";

export function InaccessibleState() {
  const t = useT();
  return (
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
      <TriangleAlert className="size-28 text-warning" strokeWidth={1.5} aria-hidden />
      <p className="text-2xl font-semibold tracking-tight">{t("inaccessible.title")}</p>
      <p className="sr-only">{t("inaccessible.body")}</p>
    </div>
  );
}
