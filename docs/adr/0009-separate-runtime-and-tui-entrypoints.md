# ADR 0009: Separate Runtime and TUI Entrypoints

## Status

Accepted

## Context

OpenCode's documented runtime plugin API loads exported plugin functions from `opencode.json`, while TUI plugins use a separate `tui` entrypoint for slot rendering.

## Decision

Expose separate package entrypoints: the package root exports the runtime installer-shim plugin function for `opencode.json`, and a `./tui` subpath loads the TUI plugin for status-bar rendering.

## Consequences

- The runtime entrypoint can be installed from remote Git through `opencode.json` without importing OpenTUI/Solid dependencies.
- The TUI entrypoint can keep using the modern slot API and OpenTUI dependencies.
- Shared measurement code must live in common modules that do not depend on either plugin surface.
