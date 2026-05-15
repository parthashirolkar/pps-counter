# ADR 0003: Sliding Window Rate Calculation

## Status

Accepted

## Context

For a "live" PPS counter, we need to decide how to calculate the rate:
1. **Cumulative average** — total tokens ÷ total time since stream start
2. **Instantaneous (sliding window)** — tokens ÷ time over a recent window
3. **Both** — show instantaneous and cumulative

The user explicitly asked for "live" numbers that update as generation happens.

## Decision

Use a **2-second sliding window** for instantaneous PPS calculation. Show only the instantaneous rate in the UI. Track cumulative internally for potential future use.

## Consequences

- **Positive**: Responsive to speed changes; feels "live"
- **Positive**: Smooth display (not jumpy like per-delta calculations)
- **Negative**: Brief lag when speed changes (2-second window)
- **Negative**: May show 0 briefly if streaming pauses for >2 seconds

## Alternatives Considered

- **Cumulative only**: Rejected because it's less responsive to speed changes
- **1-second window**: Rejected as too noisy; 2 seconds is a good balance
- **Both instantaneous and cumulative**: Rejected for clean UI; can add later
