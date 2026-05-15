# ADR 0005: Session-Scoped PPS Display

## Status

Accepted

## Context

OpenCode supports subagents, which run in parallel with the main chat. We need to decide whether PPS should:
1. Aggregate across all sessions
2. Show per-session (only the current session's streams)
3. Show per-message

## Decision

PPS is **session-scoped**. The counter only shows the token rate for the **currently viewed session**. It does not aggregate across sessions or show subagent rates in the parent session.

## Rationale

OpenCode's event architecture routes `message.part.delta` events by `sessionID`. Subagents have distinct `sessionID` values (e.g., `child-1` vs parent `session-1`). The TUI already separates token usage per session in the sidebar. Session-scoped PPS is consistent with this existing pattern.

## Consequences

- **Positive**: Simple implementation — no cross-session aggregation logic
- **Positive**: Matches user's mental model ("how fast is THIS chat going?")
- **Positive**: Consistent with OpenCode's existing per-session token tracking
- **Negative**: User won't see subagent PPS in the parent session (must open subagent window to see it)

## Alternatives Considered

- **Aggregate across all sessions**: Rejected — would be confusing to show combined rate from unrelated conversations
- **Per-message display**: Rejected for UI simplicity; session-level is sufficient
- **Show subagent PPS in parent**: Rejected — contradicts OpenCode's session isolation model
