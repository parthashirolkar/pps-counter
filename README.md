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

Install the Git package into OpenCode's global config directory:

```bash
cd ~/.config/opencode
bun add "pps-counter@git+https://github.com/parthashirolkar/pps-counter.git"
```

Then add the installed TUI entrypoint to `tui.json` or `~/.config/opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    "/home/partha/.config/opencode/node_modules/pps-counter/dist/tui.js"
  ]
}
```

Restart OpenCode after updating the TUI config.

For local development, build the plugin and point `tui.json` at this repository's built file instead:

```bash
bun run build
```

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
