# AGENTS.md

## Project identity

`pps-counter` — an OpenCode TUI plugin that displays `██▂▂▁▁▁▁ 66.3 tok/s N tok/s` in the status bar while a streaming AI response is generating.

## Commands

| Command | What |
|---------|------|
| `bun run check` | Typecheck + lint (runs both) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | `eslint src/ index.ts` |

No test suite, no CI, no pre-commit hooks.


- Single entrypoint: `index.ts`.
- The plugin uses the **modern TUI plugin API** (`api.slots.register`, `api.event.on`). See `docs/adr/` for design decisions.


## Deployment

TUI plugins must be registered in `tui.json` (NOT `opencode.json` or `~/.config/opencode/plugins/`). Those locations are for server plugins only.

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["/absolute/path/to/pps-counter/dist/index.js"]
}
```

`tui.json` can live in:
- `~/.config/opencode/tui.json` (global, all projects)
- `<project>/tui.json` (per-project)
- Or set via `OPENCODE_TUI_CONFIG` env var

The build script auto-creates `dist/package.json` with `"type": "module"` so the dist is always loaded as ESM.

## Documentation

- `CONTEXT.md` — domain glossary and streaming lifecycle.
- `docs/adr/` — architectural decision records.
- `README.md` — user-facing install and feature overview.
