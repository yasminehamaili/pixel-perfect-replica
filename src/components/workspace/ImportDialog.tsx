import { useRef, useState, type DragEvent } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { REQUIRED_FILE_IDS, type DepartmentId, type FileStatus, type RequiredFileId } from "@/config/workspace";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { FileStatusBadge } from "./FileStatusBadge";
import { useWorkspace } from "./WorkspaceProvider";

/** Mock matcher: guesses which required input a file is, from its name. */
export function matchRequiredFile(
  fileName: string,
  files: Record<RequiredFileId, FileStatus>,
): RequiredFileId | null {
  const name = fileName.toLowerCase();
  if (/sales|demand|vente/.test(name)) return "salesDemand";
  if (/stock|inventory/.test(name)) return "stockLevels";
  return REQUIRED_FILE_IDS.find((id) => files[id] === "missing") ?? null;
}

export function ImportDialog({
  open,
  onOpenChange,
  department,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: DepartmentId;
}) {
  const t = useT();
  const { files, markUploaded } = useWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    let current = { ...files };
    for (const file of Array.from(list)) {
      const id = matchRequiredFile(file.name, current);
      if (id) {
        current = { ...current, [id]: "uploaded" };
        markUploaded(id);
      }
    }
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(var(--layout-import-h),calc(100vh-2rem))] w-[min(var(--layout-import-w),calc(100vw-2rem))] max-w-none flex-col gap-5 rounded-xl p-6 shadow-pop">
        <DialogHeader>
          <DialogTitle>{t("import.title")}</DialogTitle>
          <DialogDescription>{t("import.description", { department: t(`nav.${department}`) })}</DialogDescription>
        </DialogHeader>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-input bg-muted/50 p-6 text-center transition-colors",
            "focus-within:border-ring hover:border-ring",
            dragging && "border-primary bg-accent",
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-card shadow-card">
            <UploadCloud className="size-6 text-primary" aria-hidden />
          </div>
          <div>
            <div className="text-sm font-medium">{t("import.dropTitle")}</div>
            <div className="mt-1 text-xs text-muted-foreground">{t("import.dropHint")}</div>
          </div>
          <span className="inline-flex h-8 items-center rounded-md border bg-card px-3 text-xs font-medium shadow-card">
            {t("import.browse")}
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".csv,.xlsx,.xls"
            className="sr-only"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        <section>
          <h3 className="eyebrow mb-2">{t("import.requiredFiles")}</h3>
          <ul className="space-y-2">
            {REQUIRED_FILE_IDS.map((id) => (
              <li key={id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <FileSpreadsheet className="size-4 text-muted-foreground" aria-hidden />
                <span className="flex-1 text-sm font-medium">{t(`file.${id}`)}</span>
                <FileStatusBadge status={files[id]} />
              </li>
            ))}
          </ul>
        </section>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>{t("import.done")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
