# ScanReady design-system — sync to claude.ai/design

Component-preview library for the **Warm Editorial Broadsheet** system (spec: [`../DESIGN.md`](../DESIGN.md)). Each `.html` here is a self-contained preview using the real tokens, with a first-line `<!-- @dsCard group="…" -->` marker so the Design System pane builds its card index automatically.

Cards:
- `overview.html` — full-system overview (group: Overview)
- `buttons.html` — primary / accent / secondary buttons, eyebrow label, skill chip (group: Buttons & Labels)
- `surfaces.html` — card, card-document (reading serif), hairline divider, norm-note (group: Surfaces)
- `inputs.html` — text input, mint focus ring, serif Anschreiben field, char counter (group: Inputs)
- `signature.html` — navy feature band + hero document mockup (group: Signature)

## How to push (the `DesignSync` flow)

The push needs an authenticated claude.ai/design session, which a **web** Claude Code environment can't grant. Do it one of two ways:

1. **Interactive terminal** — run Claude Code in a real terminal, `/design-login`, then `/design-sync ScanReady`: it will `list_projects` → you pick (or create) a design-system project → `finalize_plan` (writes `design-system/**`) → `write_files`.
2. **Claude Design → "Send to Claude Code Web"** — seeds the target project into the workspace, after which the same sync runs here.

Note: ScanReady is an app, not a packaged component library, so the skill's auto-converter (Storybook / bundlable package) doesn't apply — this hand-authored preview library is the sync input. Tokens here are copied verbatim from [`../src/app/globals.css`](../src/app/globals.css); if those change, update these previews too.
