# ADR 0008: Hybrid Plugin Installation

## Status

Accepted

## Context

The live PPS display requires the modern TUI slot API, but users should be able to install `pps-counter` from a remote Git package through `opencode.json` instead of cloning the repository and wiring `tui.json` manually.

## Decision

Make remote Git installation through `opencode.json` the primary documented install path by packaging `pps-counter` as a hybrid OpenCode plugin: a standard runtime plugin entrypoint for OpenCode's plugin manager plus the existing TUI plugin entrypoint for status-bar rendering.

## Consequences

- The built `dist/index.js`, `dist/tui.js`, and `dist/package.json` files are committed so Git installs do not depend on package-manager lifecycle scripts.
- Runtime dependencies are avoided for the package root; TUI-side JavaScript dependencies are bundled into `dist/tui.js` so the `opencode.json` installer shim remains trivial to install.
- `tui.json` remains a compatibility and development fallback for OpenCode versions that cannot load the TUI entrypoint from an `opencode.json` package.
- Desktop support means the runtime plugin can load without custom UI rendering; the live PPS display remains TUI-rendered.
