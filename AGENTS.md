<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Design values (colors, fonts, radii, layout sizes) live only in `src/styles.css` `:root`/`.dark` tokens; components use token utilities so exact Figma values can be dropped in one place.
- All UI strings go through `useT()` with keys in `src/i18n/dictionary.ts` (en + fr); a test fails if a French key is missing.
- Department pages are one dynamic route `src/routes/$department.tsx` validated against `DEPARTMENT_IDS` in `src/config/workspace.ts`; mock data and dev flags (e.g. `DEV_PREVIEW_INACCESSIBLE`, `API_KEY_PLACEHOLDER`) live there too.
- Report content comes only from `generateReport()` in `src/lib/report.ts` (the AI plug-in point); docs content only from Markdown in `src/docs/pages` registered in `src/docs/index.ts`.
