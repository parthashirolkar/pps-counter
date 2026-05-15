# AGENTS.md

## Project identity

`pps-counter` — an OpenCode TUI plugin that displays `⚡ N tok/s` in the status bar while a streaming AI response is generating.

## Commands

| Command | What |
|---------|------|
| `bun run check` | Typecheck + lint (runs both) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | `eslint src/ index.ts` |

No test suite, no CI, no pre-commit hooks.

## Runtime / toolchain

- **Bun** is the only runtime. Use `bun run`, not `npx` or `npm run`.
- ESM-only (`"type": "module"` in package.json).
- ESLint v9 flat config in `eslint.config.js`.

## Architecture

```
index.ts          → re-exports tui from src/plugin
src/plugin.ts     → registers TUI plugin, wires events to tracker
src/tracker.ts    → PPSTracker: sliding-window token rate calculator
src/components/    → (removed; rendering handled inline in plugin.ts via SolidJS signals)
```

- Single entrypoint: `index.ts`.
- The plugin uses the **modern TUI plugin API** (`api.slots.register`, `api.event.on`). See `docs/adr/` for design decisions.
- Slots into `session_prompt_right` to avoid conflicting with the built-in token counter.
- Listens to `message.part.delta` (streaming chunks) and `message.updated` (stream completion).

## TypeScript conventions

- `verbatimModuleSyntax: true` — use `import type` for type-only imports.
- JSX via `"jsx": "preserve"` / `"jsxImportSource": "solid-js"` — SolidJS is the UI framework; no React in the project.
- `noUnusedLocals` and `noUnusedParameters` are **off** in tsconfig, but **on** in ESLint (`@typescript-eslint/no-unused-vars: error`, args prefixed `_` allowed).

## Key tokens/entities

- **PPSTracker** — stateful, time-windowed token rate calculator (char/4 heuristic, 2s default window).
- **PPSTracker.onUpdate** — callback-based subscription that drives `ppsText` SolidJS signal updates in `plugin.ts`.
- Session/message tracking uses compound keys: `sessionID:messageID`.

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
