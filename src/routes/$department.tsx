import { createFileRoute, notFound } from "@tanstack/react-router";

import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { isDepartmentId, type DepartmentId } from "@/config/workspace";
import { translate } from "@/i18n/dictionary";

export const Route = createFileRoute("/$department")({
  beforeLoad: ({ params }) => {
    if (!isDepartmentId(params.department)) throw notFound();
  },
  head: ({ params }) => {
    const id = params.department as DepartmentId;
    const name = isDepartmentId(id) ? translate("en", `nav.${id}`) : "Workspace";
    const title = `${name} · NORTHSTAR Finance Workspace`;
    const description = `${name} dashboard, data readiness and reports in the NORTHSTAR finance workspace.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: DepartmentPage,
});

function DepartmentPage() {
  const { department } = Route.useParams();
  return <WorkspaceLayout department={department as DepartmentId} />;
}
