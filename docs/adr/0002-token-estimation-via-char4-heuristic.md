# ADR 0002: Token Estimation via Char/4 Heuristic

## Status

Accepted

## Context

Two ways to determine token counts:
1. **Provider-reported counts** — available on `message.updated` events via `message.tokens.output`
2. **Estimated counts** — calculate from delta text length using a heuristic

The `message.part.delta` events (which fire live during streaming) only carry text deltas, not token counts. Provider-reported counts are only available after the message completes or on periodic `message.updated` events.

## Decision

Use the **char/4 heuristic** on `message.part.delta` events to estimate tokens in real-time.

## Consequences

- **Positive**: Enables live PPS calculation (provider counts are too laggy)
- **Positive**: Provider-agnostic (works with OpenCode Zen/Go, OpenRouter, OpenAI, etc.)
- **Negative**: Less accurate than provider counts; ~4 chars/token is approximate
- **Negative**: May over/under-estimate for non-English text or code

## Alternatives Considered

- **Provider-reported tokens**: Rejected because they don't arrive live and vary by provider
- **Hybrid (estimate live, correct at end)**: Rejected for simplicity; can add later
