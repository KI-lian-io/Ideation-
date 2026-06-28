# ScanReady design-system — sync to claude.ai/design

Component-preview library for the **Warm Editorial Broadsheet** system (spec: [`../DESIGN.md`](../DESIGN.md)). Each `.html` here is a self-contained preview using the real tokens, with a first-line `<!-- @dsCard group="…" -->` marker so the Design System pane builds its card index automatically.

Current cards:
- `overview.html` — full-system overview (group: Overview)

_Planned expansion (one card each): `buttons.html`, `surfaces.html`, `inputs.html`, `signature.html` — split out when we sync._

## How to push (the `DesignSync` flow)

The push needs an authenticated claude.ai/design session, which a **web** Claude Code environment can't grant. Do it one of two ways:

1. **Interactive terminal** — run Claude Code in a real terminal, `/design-login`, then ask it to sync this directory: it will `list_projects` → you pick (or create) a design-system project → `finalize_plan` (writes `design-system/**`) → `write_files`.
2. **Claude Design → "Send to Claude Code Web"** — seeds the target project into the workspace, after which the same sync runs here.

Either way the plan is: write `design-system/*.html` into the chosen project; cards register from the `@dsCard` markers (no manual `register_assets` needed).
