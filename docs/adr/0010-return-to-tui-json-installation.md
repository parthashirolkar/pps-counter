# ADR 0010: Return to TUI JSON Installation

## Status

Accepted

## Context

The live PPS display depends on OpenCode's modern TUI slot API. Packaging the project as a hybrid plugin for remote Git installation through `opencode.json` added a runtime installer shim, extra entrypoints, and compatibility assumptions that did not improve the core TUI behavior.

OpenCode Desktop currently does not expose plugin-rendered UI surfaces for this counter, so installing the package through `opencode.json` would not make the TPS display available in Desktop.

## Decision

Make `tui.json` the primary supported installation path again. The plugin is referenced from `tui.json` as a Git package, and its package root exports the TUI module.

## Consequences

- The package no longer needs a runtime installer shim for `opencode.json`.
- The build produces the TUI entrypoint used by OpenCode's TUI plugin loader.
- Users can reference the Git package from `tui.json`; local `dist/tui.js` paths remain useful for development.
- The counter implementation remains unchanged: it still uses the modern TUI slot API and streaming events.
