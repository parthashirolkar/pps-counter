# AGENTS.md

## Project identity

`pps-counter` — an OpenCode TUI plugin that displays `██▂▂▁▁▁▁ 66.3 tok/s` in the status bar while a streaming AI response is generating.

## Commands

| Command | What |
|---------|------|
| `bun run check` | Typecheck + lint (runs both) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | `eslint src/ tui.ts` |

No test suite, no CI, no pre-commit hooks.


- TUI entrypoint: `tui.ts` exports the modern TUI plugin (`api.slots.register`, `api.event.on`). See `docs/adr/` for design decisions.


## Deployment

Primary install path is `tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["/home/partha/.config/opencode/node_modules/pps-counter/dist/tui.js"]
}
```

`tui.json` can live in:
- `~/.config/opencode/tui.json` (global, all projects)
- `<project>/tui.json` (per-project)
- Or set via `OPENCODE_TUI_CONFIG` env var

Install or update the package from GitHub in OpenCode's global config directory:

```bash
cd ~/.config/opencode
bun add "pps-counter@git+https://github.com/parthashirolkar/pps-counter.git"
```

The build script auto-creates `dist/package.json` with `"type": "module"` so the dist is always loaded as ESM.

## Documentation

- `CONTEXT.md` — domain glossary and streaming lifecycle.
- `docs/adr/` — architectural decision records.
- `README.md` — user-facing install and feature overview.
