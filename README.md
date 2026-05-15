# PPS Counter

A live sparkline tokens-per-second (TPS) counter for the OpenCode TUI.

## What it does

Displays `██▂▂▁▁▁▁ 66.3 tok/s` in the status bar while the AI is generating a streaming response. Uses a 2-second sliding window to calculate the instantaneous token rate.

## Features

- **Live updates**: Counter refreshes in real-time as tokens stream in
- **Session-scoped**: Only shows PPS for the current session (handles subagents correctly)
- **Provider-agnostic**: Works with any OpenCode-compatible provider
- **Zero configuration**: Just install and it works

## Installation

Add the package to `opencode.json` or `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "pps-counter@git+https://github.com/parthashirolkar/pps-counter.git"
  ]
}
```

Restart OpenCode so the plugin manager installs the package.

The package root is a runtime installer shim. The live counter is rendered by the TUI entrypoint at `pps-counter/tui`.

If your OpenCode version does not activate TUI entrypoints from `opencode.json` packages yet, use `tui.json` as a compatibility fallback:

```bash
bun run build
```

Then add the built TUI plugin to `tui.json` or `~/.config/opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    "/absolute/path/to/pps-counter/dist/tui.js"
  ]
}
```

You can also point OpenCode at a specific TUI config file:

```bash
OPENCODE_TUI_CONFIG=/absolute/path/to/tui.json opencode
```

## How it works

- Listens to `message.part.delta` events to estimate tokens (char/4 heuristic)
- Calculates rate over a 2-second sliding window
- Renders in the `session_prompt_right` slot of the TUI
- Automatically hides when streaming completes

## Architecture

See `docs/adr/` for architectural decision records.

## License

MIT
