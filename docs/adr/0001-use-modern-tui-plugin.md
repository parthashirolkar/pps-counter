# ADR 0001: Use Modern TUI Plugin System

## Status

Accepted

## Context

OpenCode has two plugin systems:
1. **Legacy event-based plugins** — documented, universal across TUI/web/API, but limited to toasts and prompt appending
2. **Modern TUI plugins** — undocumented, TUI-only, supports JSX slot rendering

The user wants PPS displayed "next to the token counter in the TUI status bar." The legacy system cannot modify the status bar inline — it can only show toasts or append text to the prompt.

## Decision

Use the **modern TUI plugin system** with `api.slots.register()` to render PPS in the `session_prompt_right` slot.

## Consequences

- **Positive**: Can render inline next to existing UI elements; live-updating display
- **Positive**: Access to reactive state via `api.state` and event bus via `api.event.on()`
- **Negative**: TUI-only; won't work in web or API mode
- **Negative**: Undocumented API; subject to breaking changes

## Alternatives Considered

- **Legacy event-based plugin**: Rejected because it cannot render in the status bar
- **Hybrid approach (both plugin types)**: Rejected for initial build; can add later if needed
