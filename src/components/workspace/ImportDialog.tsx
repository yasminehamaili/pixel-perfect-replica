import { useRef, useState, type DragEvent } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { REQUIRED_FILE_IDS, type DepartmentId, type FileStatus, type RequiredFileId } from "@/config/workspace";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { FileStatusBadge } from "./FileStatusBadge";
import { useWorkspace } from "./WorkspaceProvider";

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
  const { files, markUploaded, uploadAndAnalyze, uploading, uploadError, doc } = useWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    let current = { ...files };
    const fileArray = Array.from(list);

    for (const file of fileArray) {
      const id = matchRequiredFile(file.name, current);
      if (id) {
        current = { ...current, [id]: "uploaded" };
        markUploaded(id);
      }
    }

    // Send the first uploaded file to the backend LLM extraction pipeline
    try {
      await uploadAndAnalyze(fileArray[0]);
    } catch {
      // Error is displayed via uploadError in workspace state
    }
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    void handleFiles(e.dataTransfer.files);
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
            uploading && "pointer-events-none opacity-70",
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-card shadow-card">
            {uploading ? (
              <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
            ) : (
              <UploadCloud className="size-6 text-primary" aria-hidden />
            )}
          </div>
          <div>
            <div className="text-sm font-medium">
              {uploading ? "Analyzing document with AI..." : t("import.dropTitle")}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Supported: PDF, DOCX, CSV, TXT, MD (max 20 MB)
            </div>
          </div>
          {!uploading && (
            <span className="inline-flex h-8 items-center rounded-md border bg-card px-3 text-xs font-medium shadow-card">
              {t("import.browse")}
            </span>
          )}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.csv,.md"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        {uploadError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {doc && !uploading && !uploadError && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>
              Analyzed <strong>{doc.filename}</strong> — dashboard is ready.
            </span>
          </div>
        )}

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
          <Button onClick={() => onOpenChange(false)} disabled={uploading}>
            {t("import.done")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}