import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/$department", params: { department: "overview" } });
  },
  head: () => ({
    meta: [
      { title: "NORTHSTAR · Finance Workspace" },
      { name: "description", content: "NORTHSTAR finance workspace: department dashboards, data imports and reports." },
      { property: "og:title", content: "NORTHSTAR · Finance Workspace" },
      { property: "og:description", content: "Department dashboards, data imports and reports in one finance workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
