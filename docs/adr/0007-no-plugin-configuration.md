# ADR 0007: No Plugin Configuration

## Status

Accepted

## Context

We need to decide whether the PPS plugin should expose user-configurable settings (sliding window size, display format, etc.) or use fixed defaults.

## Decision

The plugin uses **hardcoded defaults** with no configuration interface:
- Sliding window: fixed at 2 seconds
- Display format: fixed as `/|\\ N tok/s`
- Precision: fixed as whole numbers
- No keyboard shortcuts
- No settings persistence

## Rationale

The plugin is designed to be zero-configuration. If enabled in `opencode.json`, it simply works. This matches the simplicity of the feature and avoids configuration complexity for a status indicator.

## Consequences

- **Positive**: Simple installation — just add to `opencode.json`
- **Positive**: No cognitive overhead for users
- **Positive**: Predictable behavior across all users
- **Negative**: Power users cannot customize window size or display format

## Alternatives Considered

- **Settings via `api.kv`**: Rejected — adds complexity for marginal benefit
- **Keyboard shortcut to toggle**: Rejected — user explicitly said not needed for now
- **Config via `opencode.json` plugin options**: Rejected — unnecessary for initial build
