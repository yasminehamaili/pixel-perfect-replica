import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

import {
  INITIAL_FILE_STATUS,
  type FileStatus,
  type RequiredFileId,
} from "@/config/workspace";
import {
  generateReports,
  sendChatMessage,
  uploadDocument,
  type ChatMessage,
  type NewsArticle,
  type UploadedDocument,
} from "@/lib/api";
import { DEFAULT_PRESET, getPresetRange, type DateRange } from "@/lib/date-range";

type WorkspaceValue = {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  files: Record<RequiredFileId, FileStatus>;
  markUploaded: (id: RequiredFileId) => void;

  // Backend AI & Dashboard state
  doc: UploadedDocument | null;
  reports: Record<string, string>;
  news: NewsArticle[];
  uploading: boolean;
  reportsLoading: boolean;
  /** Whole report request failed (network, backend restarted, LLM down). */
  reportsError: string | null;
  /** Departments whose report failed while the others succeeded: backend key -> message. */
  reportErrors: Record<string, string>;
  uploadError: string | null;
  uploadAndAnalyze: (file: File) => Promise<void>;
  retryReports: () => Promise<void>;

  // Chatbot state
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  sendChat: (message: string) => Promise<void>;
  clearChat: () => void;
};

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetRange(DEFAULT_PRESET));
  const [files, setFiles] = useState(INITIAL_FILE_STATUS);

  const [doc, setDoc] = useState<UploadedDocument | null>(null);
  const [reports, setReports] = useState<Record<string, string>>({});
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [uploading, setUploading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [reportErrors, setReportErrors] = useState<Record<string, string>>({});
  const docIdRef = useRef<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const markUploaded = useCallback((id: RequiredFileId) => {
    setFiles((prev) => ({ ...prev, [id]: "uploaded" }));
  }, []);

  /** Asks the backend for the 5 department reports + market news for one document. */
  const runReports = useCallback(async (docId: string) => {
    setReportsLoading(true);
    setReportsError(null);
    setReportErrors({});
    try {
      const res = await generateReports(docId);
      if (docIdRef.current !== docId) return; // a newer document replaced this one
      setReports(res.reports);
      setNews(res.news);
      setReportErrors(res.errors ?? {});
    } catch (err) {
      if (docIdRef.current !== docId) return;
      console.error("Report generation error:", err);
      setReportsError(err instanceof Error ? err.message : "Report generation failed");
    } finally {
      if (docIdRef.current === docId) setReportsLoading(false);
    }
  }, []);

  const retryReports = useCallback(async () => {
    if (docIdRef.current) await runReports(docIdRef.current);
  }, [runReports]);

  const uploadAndAnalyze = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadError(null);
      try {
        const uploaded = await uploadDocument(file);
        docIdRef.current = uploaded.id;
        setDoc(uploaded);
        setChatMessages([]);
        setReports({});
        setNews([]);
        setReportsError(null);
        setReportErrors({});
        // Reports are written in the background; the dashboard is usable straight away.
        void runReports(uploaded.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to analyze document";
        setUploadError(msg);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [runReports],
  );

  const sendChat = useCallback(
    async (message: string) => {
      if (!doc || !message.trim()) return;
      const trimmed = message.trim();
      const historySnapshot = [...chatMessages];

      setChatMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setChatLoading(true);
      try {
        const answer = await sendChatMessage(doc.id, trimmed, historySnapshot);
        setChatMessages((prev) => [...prev, { role: "assistant", content: answer }]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unable to reach assistant.";
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${msg}` },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [doc, chatMessages],
  );

  const clearChat = useCallback(() => setChatMessages([]), []);

  const value = useMemo(
    () => ({
      dateRange,
      setDateRange,
      files,
      markUploaded,
      doc,
      reports,
      news,
      uploading,
      reportsLoading,
      reportsError,
      reportErrors,
      uploadError,
      uploadAndAnalyze,
      retryReports,
      chatMessages,
      chatLoading,
      sendChat,
      clearChat,
    }),
    [
      dateRange,
      files,
      markUploaded,
      doc,
      reports,
      news,
      uploading,
      reportsLoading,
      reportsError,
      reportErrors,
      uploadError,
      uploadAndAnalyze,
      retryReports,
      chatMessages,
      chatLoading,
      sendChat,
      clearChat,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}