# ADR 0010: Return to TUI JSON Installation

## Status

Accepted

## Context

The live PPS display depends on OpenCode's modern TUI slot API. Packaging the project as a hybrid plugin for remote Git installation through `opencode.json` added a runtime installer shim, extra entrypoints, and compatibility assumptions that did not improve the core TUI behavior.

OpenCode Desktop currently does not expose plugin-rendered UI surfaces for this counter, so installing the package through `opencode.json` would not make the TPS display available in Desktop.

## Decision

Make `tui.json` the primary supported installation path again. The plugin is installed into OpenCode's global config directory from GitHub, and `tui.json` references the installed `dist/tui.js` file.

## Consequences

- The package no longer needs a runtime installer shim for `opencode.json`.
- The build produces the TUI entrypoint used by OpenCode's TUI plugin loader.
- Users can install or update the package from GitHub without cloning this repository manually.
- Direct Git package references in `tui.json` are avoided because OpenCode's TUI plugin resolver currently fails during Git dependency preparation for this package.
- The counter implementation remains unchanged: it still uses the modern TUI slot API and streaming events.
