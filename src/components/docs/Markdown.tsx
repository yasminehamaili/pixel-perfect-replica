import { Children, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, CircleAlert, Copy, Info, Lightbulb } from "lucide-react";

import { slugify } from "@/docs";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

type MdNode = { type: string; value?: string; children?: MdNode[]; data?: { hProperties?: Record<string, string> } };

/** Turns `> [!NOTE]` / `[!TIP]` / `[!WARNING]` blockquotes into callouts. */
function remarkCallouts() {
  const walk = (node: MdNode) => {
    if (node.type === "blockquote") {
      const first = node.children?.[0];
      const text = first?.type === "paragraph" ? first.children?.[0] : undefined;
      const match = text?.type === "text" ? /^\[!(NOTE|TIP|WARNING)\]\s*/i.exec(text.value ?? "") : null;
      if (text && match?.[1]) {
        text.value = (text.value ?? "").slice(match[0].length);
        node.data = { hProperties: { "data-callout": match[1].toLowerCase() } };
      }
    }
    node.children?.forEach(walk);
  };
  return (tree: MdNode) => walk(tree);
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const child = Children.only(children) as ReactElement<{ className?: string; children?: ReactNode }>;
  const code = textOf(child.props.children).replace(/\n$/, "");
  const lang = /language-(\w+)/.exec(child.props.className ?? "")?.[1];

  return (
    <div className="relative my-5 overflow-hidden rounded-lg border bg-code">
      <div className="flex h-9 items-center justify-between border-b px-3 text-xs text-muted-foreground">
        <span className="font-mono">{lang ?? "text"}</span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex h-6 items-center gap-1 rounded px-1.5 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? <Check className="size-3.5 text-success" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          <span aria-live="polite">{copied ? t("docs.copied") : t("docs.copy")}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-code-foreground">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

const CALLOUT = {
  note: { icon: Info, className: "border-primary/30 bg-accent/60" },
  tip: { icon: Lightbulb, className: "border-success/30 bg-success-soft" },
  warning: { icon: CircleAlert, className: "border-warning/40 bg-warning-soft" },
} as const;

function Heading({ level, children }: { level: 1 | 2 | 3; children?: ReactNode }) {
  const id = slugify(textOf(children));
  if (level === 1) return <h1 className="mb-4 text-3xl font-semibold tracking-tight">{children}</h1>;
  if (level === 2)
    return (
      <h2 id={id} data-toc className="mb-3 mt-10 scroll-mt-6 border-t pt-8 text-xl font-semibold tracking-tight">
        {children}
      </h2>
    );
  return (
    <h3 id={id} data-toc className="mb-2 mt-7 scroll-mt-6 text-base font-semibold">
      {children}
    </h3>
  );
}

const components: Components = {
  h1: ({ children }) => <Heading level={1}>{children}</Heading>,
  h2: ({ children }) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }) => <Heading level={3}>{children}</Heading>,
  p: ({ children }) => <p className="my-4 leading-7 text-foreground/90">{children}</p>,
  ul: ({ children }) => <ul className="my-4 list-disc space-y-1.5 pl-6 marker:text-muted-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 list-decimal space-y-1.5 pl-6 marker:text-muted-foreground">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} className="font-medium text-primary underline underline-offset-4">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">{children}</code>
  ),
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
  th: ({ children }) => <th className="border-b px-4 py-2.5 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b px-4 py-2.5 align-top text-foreground/90">{children}</td>,
  blockquote: ({ children, node }) => {
    const props = node?.properties ?? {};
    const kind = (props["dataCallout"] ?? props["data-callout"]) as keyof typeof CALLOUT | undefined;
    const callout = kind ? CALLOUT[kind] : undefined;
    if (!callout) {
      return <blockquote className="my-4 border-l-2 pl-4 text-muted-foreground">{children}</blockquote>;
    }
    const Icon = callout.icon;
    return (
      <aside className={cn("my-5 flex gap-3 rounded-lg border px-4 py-1 [&_p]:my-2.5", callout.className)}>
        <Icon className="mt-3.5 size-4 shrink-0 text-foreground/80" aria-hidden />
        <div className="min-w-0 flex-1">{children}</div>
      </aside>
    );
  },
};

export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkCallouts]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
