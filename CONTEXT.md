# Context: PPS Counter

## Project

`pps-counter` — An OpenCode plugin that displays a live "tokens per second" (PPS) counter in the TUI status bar, measuring the speed at which the user sees streaming generation happen.

## Glossary

| Term | Definition |
|------|------------|
| **PPS** | Plugin's name: Wordplay on creator's full name. Rhymes with TPS (tokens per second). |
| **TPS** | "Tokens Per Second" — the actual metric being measured (output tokens generated per second). |
| **Sliding Window** | A time-based window (default 2 seconds) over which instantaneous token rate is calculated. |
| **Char/4 Heuristic** | Token estimation method: divide character count by 4 to approximate tokens. |
| **Delta** | A chunk of streaming text emitted during generation (`message.part.delta` event). |
| **TUI Plugin** | Modern OpenCode plugin system using slot-based JSX rendering. |
| **Event-Based Plugin** | Legacy OpenCode plugin system using hook functions. |
| **Lightning Bolt** | The `⚡` symbol used as the PPS counter icon in the TUI status bar. |
| **Instantaneous PPS** | Live token rate calculated over a 2-second sliding window. |
| **Cumulative PPS** | Average token rate since the stream started. |

## Domain Model

### Streaming Lifecycle

1. **Stream Start** — First `message.part.delta` event arrives for a message
2. **Streaming** — Deltas arrive continuously; PPS counter updates live
3. **Stream Complete** — `message.updated` event with `time.completed`; PPS counter lingers briefly then disappears

### Measurement Windows

- **Instantaneous PPS**: Token rate over the last 2-second sliding window
- **Cumulative PPS**: Average token rate since stream start

## Key Decisions

See `docs/adr/` for architectural decision records.

## Constraints

- TUI-only (no web or API support in initial build)
- Provider-agnostic (works with any OpenCode-compatible provider)
- Estimated tokens only (no provider-reported counts)
- Must not interfere with existing token counter display
