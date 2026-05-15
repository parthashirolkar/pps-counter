# ADR 0004: Visual Design for PPS Counter

## Status

Accepted

## Context

The PPS counter needs a visual presence in the TUI status bar. We need to decide:
- Display format and iconography
- Number precision
- Behavior when not streaming
- Color scheme

## Decision

- **Icon**: Unicode lightning bolt `⚡`
- **Format**: `⚡ N tok/s` where N shows 1 decimal place for precision (e.g., `45.2 tok/s`)
- **Precision**: Format to 1 decimal place when value is < 100, whole numbers when ≥ 100 (e.g., `45.2 tok/s`, `145 tok/s`)
- **When not streaming**: Hide completely (no counter = no active generation)
- **Colors**: Single color (inherit from terminal theme via `currentColor`); no speed-based coloring for simplicity

## Consequences

- **Positive**: Clean, minimal status bar presence
- **Positive**: No visual clutter when idle
- **Positive**: Whole numbers are easy to read at a glance
- **Negative**: No visual feedback on "fast" vs "slow" generation
- **Negative**: ASCII art may not look as polished as Unicode emoji

## Alternatives Considered

- **ASCII art bolt `/|\`**: Rejected — Unicode bolt is more visually appealing
- **Show `0 tok/s` when idle**: Rejected — creates visual noise when not generating
- **Decimal precision**: Rejected — whole numbers are sufficient for this metric
- **Speed-based colors**: Rejected for initial build; can add later
