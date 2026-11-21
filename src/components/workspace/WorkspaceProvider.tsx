import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  INITIAL_FILE_STATUS,
  type FileStatus,
  type RequiredFileId,
} from "@/config/workspace";
import { DEFAULT_PRESET, getPresetRange, type DateRange } from "@/lib/date-range";

type WorkspaceValue = {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  files: Record<RequiredFileId, FileStatus>;
  markUploaded: (id: RequiredFileId) => void;
};

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetRange(DEFAULT_PRESET));
  const [files, setFiles] = useState(INITIAL_FILE_STATUS);

  const markUploaded = useCallback((id: RequiredFileId) => {
    setFiles((prev) => ({ ...prev, [id]: "uploaded" }));
  }, []);

  const value = useMemo(
    () => ({ dateRange, setDateRange, files, markUploaded }),
    [dateRange, files, markUploaded],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}
