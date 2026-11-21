import { useState } from "react";
import { FileText } from "lucide-react";

import { DocsOverlay } from "@/components/docs/DocsOverlay";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { isDepartmentAccessible, type DepartmentId } from "@/config/workspace";
import { useT } from "@/i18n/I18nProvider";
import { AccountSidebar } from "./AccountSidebar";
import { ChatbotWidget } from "./ChatbotWidget";
import { DashboardView } from "./DashboardView";
import { ImportDialog } from "./ImportDialog";
import { InaccessibleState } from "./InaccessibleState";
import { ReportOverlay } from "./ReportOverlay";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function WorkspaceLayout({ department }: { department: DepartmentId }) {
  const t = useT();
  const accessible = isDepartmentAccessible(department);
  const [importOpen, setImportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar department={department} onOpenDocs={() => setDocsOpen(true)} />

      <main className="flex min-w-0 flex-1 flex-col">
        <TopNav
          department={department}
          accessible={accessible}
          onReimport={() => setImportOpen(true)}
          onOpenAccount={() => setAccountOpen(true)}
        />
        {accessible ? (
          <div className="mx-auto flex w-full max-w-(--layout-main-max) flex-col gap-4 p-(--layout-gutter) pb-24">
            <DashboardView
              department={department}
              onOpenImport={() => setImportOpen(true)}
              onOpenReport={() => setReportOpen(true)}
            />
            <div className="flex justify-end">
              <Button variant="toolbar" size="toolbar" onClick={() => setReportOpen(true)}>
                <FileText aria-hidden />
                {t("report.button")}
              </Button>
            </div>
          </div>
        ) : (
          <InaccessibleState />
        )}
      </main>

      <AccountSidebar department={department} className="sticky top-0 hidden h-screen border-l xl:flex" />

      <Sheet open={accountOpen} onOpenChange={setAccountOpen}>
        <SheetContent side="right" className="w-(--layout-account) p-0 sm:max-w-none xl:hidden">
          <SheetTitle className="sr-only">{t("account.title")}</SheetTitle>
          <AccountSidebar department={department} className="h-full pt-12" />
        </SheetContent>
      </Sheet>

      {accessible && (
        <>
          <ImportDialog open={importOpen} onOpenChange={setImportOpen} department={department} />
          <ReportOverlay
            open={reportOpen}
            onOpenChange={setReportOpen}
            department={department}
            onOpenImport={() => setImportOpen(true)}
          />
          <ChatbotWidget department={department} />
        </>
      )}
      <DocsOverlay open={docsOpen} onOpenChange={setDocsOpen} />
    </div>
  );
}