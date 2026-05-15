# AGENTS.md

## Project identity

`pps-counter` — a hybrid OpenCode plugin whose TUI entrypoint displays `██▂▂▁▁▁▁ 66.3 tok/s` in the status bar while a streaming AI response is generating.

## Commands

| Command | What |
|---------|------|
| `bun run check` | Typecheck + lint (runs both) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | `eslint src/ index.ts tui.ts` |

No test suite, no CI, no pre-commit hooks.


- Runtime entrypoint: `index.ts` exports an installer-shim plugin function for `opencode.json`.
- TUI entrypoint: `tui.ts` exports the modern TUI plugin (`api.slots.register`, `api.event.on`). See `docs/adr/` for design decisions.


## Deployment

Primary install path is remote Git through `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["pps-counter@git+https://github.com/parthashirolkar/pps-counter.git"]
}
```

The package root is a runtime installer shim. The live counter is rendered by the TUI entrypoint at `pps-counter/tui`.

If the current OpenCode version cannot activate TUI entrypoints from `opencode.json` packages, use `tui.json` as a compatibility fallback:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["/absolute/path/to/pps-counter/dist/tui.js"]
}
```

`tui.json` can live in:
- `~/.config/opencode/tui.json` (global, all projects)
- `<project>/tui.json` (per-project)
- Or set via `OPENCODE_TUI_CONFIG` env var

The build script auto-creates `dist/package.json` with `"type": "module"` so the dist is always loaded as ESM. The three installable dist files are intentionally committed despite `.gitignore`: `dist/index.js`, `dist/tui.js`, and `dist/package.json`.

## Documentation

- `CONTEXT.md` — domain glossary and streaming lifecycle.
- `docs/adr/` — architectural decision records.
- `README.md` — user-facing install and feature overview.
