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
| **Runtime Plugin** | Standard OpenCode plugin system loaded from `opencode.json` for shared hook/tool behavior across OpenCode surfaces. |
| **Installer Shim** | Minimal Runtime Plugin whose purpose is to let OpenCode install and load the package without providing user-facing behavior. |
| **Hybrid Plugin** | An OpenCode plugin package that exposes both a Runtime Plugin entrypoint and a TUI Plugin entrypoint. |
| **Lightning Bolt** | The `⚡` symbol used as the PPS counter icon in the TUI status bar. |
| **Instantaneous PPS** | Live token rate calculated over a 2-second sliding window. |
| **Cumulative PPS** | Average token rate since the stream started. |
| **Sparkline** | Unicode bar chart (`▁▂▃▄▅▆▇█`) showing the last N PPS samples in the status bar to visualize bursts and dips. |
| **Trend Color** | A single hue applied to the sparkline text element indicating throughput direction: green (steady/improving), yellow (slowing), red (dropping sharply). |
| **Polling Interval** | A 200ms timer interval that samples instant PPS during active streaming to feed the sparkline buffer. |
| **Ring Buffer** | Fixed-capacity FIFO array (N=30) storing the most recent PPS snapshots; ~240 bytes per session. |
| **Stream Start Event** | The `session.next.text.started` event — definitive signal that AI text generation has begun for the current "next" message. |
| **Stream End Event** | The `session.next.text.ended` event — definitive signal that AI text generation has finished. |

## Domain Model

### Streaming Lifecycle

1. **Stream Start** — `session.next.text.started` fires; old PPS/sparkline state is cleared, polling begins
2. **Streaming** — `session.next.text.delta` deltas arrive; PPS counter updates live; polling captures samples into the sparkline ring buffer
3. **Stream Complete** — `session.next.text.ended` fires; polling stops; final sparkline lingers ~2s then fades to `-- tps`

### Measurement Windows

- **Instantaneous PPS**: Token rate over the last 2-second sliding window
- **Cumulative PPS**: Average token rate since stream start

### Sparkline

- **Ring buffer capacity**: 30 samples (capped, no unbounded growth)
- **Sample rate**: 200ms via `setInterval` while streaming is active
- **Bar encoding**: 8 unicode levels mapping min→max of the buffer
- **Trend detection**: Simple linear regression slope over the buffer
- **Color mapping**: slope ≥ -0.5 → green; slope < -2.0 → red; between → yellow
- **Memory**: ~240 bytes per session; cleaned up on stream end

## Key Decisions

See `docs/adr/` for architectural decision records.

## Constraints

- Live PPS display is TUI-rendered; Desktop support means runtime loading only, not custom Desktop UI rendering
- Provider-agnostic (works with any OpenCode-compatible provider)
- Estimated tokens only (no provider-reported counts)
- Must not interfere with existing token counter display
