# ADR 0006: Slot Placement in TUI

## Status

Accepted

## Context

The user wants PPS displayed next to the existing token counter in the bottom-right of the TUI session view (as shown in screenshot). We need to select the correct slot from OpenCode's TUI plugin system.

## Decision

Register the PPS component in the **`session_prompt_right`** slot.

## Rationale

The target location (bottom-right of session view, adjacent to token usage text) corresponds to the session prompt's right metadata area. The `session_prompt_right` slot is designed for session-specific status indicators. This places PPS in the same visual region as the existing token counter without replacing it.

## Consequences

- **Positive**: Session-scoped — only shows when in an active session
- **Positive**: Adjacent to existing token usage display
- **Positive**: Ephemeral by design (slot only renders when session is active)
- **Negative**: Exact positioning depends on OpenCode's internal layout; may not be pixel-perfect next to token counter

## Alternatives Considered

- **`app_bottom`**: Rejected — not session-specific; would show on home page too
- **`sidebar_content`**: Rejected — wrong location (sidebar, not bottom bar)
- **Replace `home_footer`**: Rejected — user wants PPS in session view, not home view
