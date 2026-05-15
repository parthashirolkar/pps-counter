# ADR 0009: Separate Runtime and TUI Entrypoints

## Status

Accepted

## Context

OpenCode's plugin types model runtime plugins as modules with a `server` entrypoint and TUI plugins as modules with a `tui` entrypoint. The current type definitions make those module shapes mutually exclusive.

## Decision

Expose separate package entrypoints: the package root loads the runtime plugin for `opencode.json`, and a `./tui` subpath loads the TUI plugin for status-bar rendering.

## Consequences

- The runtime entrypoint can be installed from remote Git through `opencode.json` without importing OpenTUI/Solid dependencies.
- The TUI entrypoint can keep using the modern slot API and OpenTUI dependencies.
- Shared measurement code must live in common modules that do not depend on either plugin surface.
