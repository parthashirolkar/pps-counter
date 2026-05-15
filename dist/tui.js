// src/plugin.ts
import { createElement, setProp } from "@opentui/solid";
import { createSignal } from "solid-js";

// src/tracker.ts
class PPSTracker {
  windows = new Map;
  startTimes = new Map;
  completedMessages = new Set;
  windowSizeMs;
  listeners = new Set;
  constructor(windowSizeMs = 2000) {
    this.windowSizeMs = windowSizeMs;
  }
  addDelta(sessionID, messageID, delta) {
    const now = Date.now();
    const key = this.key(sessionID, messageID);
    if (this.completedMessages.has(key))
      return;
    if (!this.startTimes.has(key)) {
      this.startTimes.set(key, now);
    }
    const estimatedTokens = Math.max(1, Math.ceil(delta.length / 4));
    let windows = this.windows.get(key);
    if (!windows) {
      windows = [];
      this.windows.set(key, windows);
    }
    windows.push({ timestamp: now, tokens: estimatedTokens });
    const cutoff = now - this.windowSizeMs;
    while (windows.length > 0 && windows[0].timestamp < cutoff) {
      windows.shift();
    }
    this.notifyListeners();
  }
  getPPS(sessionID, messageID) {
    const key = this.key(sessionID, messageID);
    const windows = this.windows.get(key);
    if (!windows || windows.length === 0)
      return 0;
    const now = Date.now();
    const cutoff = now - this.windowSizeMs;
    const relevantWindows = windows.filter((w) => w.timestamp >= cutoff);
    if (relevantWindows.length === 0)
      return 0;
    const totalTokens = relevantWindows.reduce((sum, w) => sum + w.tokens, 0);
    const timeSpan = relevantWindows[relevantWindows.length - 1].timestamp - relevantWindows[0].timestamp;
    if (timeSpan === 0) {
      return totalTokens * 1000;
    }
    return totalTokens / timeSpan * 1000;
  }
  getCumulativePPS(sessionID, messageID) {
    const key = this.key(sessionID, messageID);
    const windows = this.windows.get(key);
    const startTime = this.startTimes.get(key);
    if (!windows || windows.length === 0 || !startTime)
      return 0;
    const totalTokens = windows.reduce((sum, w) => sum + w.tokens, 0);
    const elapsed = Date.now() - startTime;
    if (elapsed === 0)
      return 0;
    return totalTokens / elapsed * 1000;
  }
  getMostRecentActiveMessage(sessionID) {
    const now = Date.now();
    const cutoff = now - this.windowSizeMs * 2;
    let mostRecent = null;
    for (const [key, windows] of this.windows) {
      if (key.startsWith(`${sessionID}:`)) {
        const messageID = key.split(":")[1];
        if (this.completedMessages.has(key))
          continue;
        const lastWindow = windows[windows.length - 1];
        if (lastWindow.timestamp >= cutoff) {
          if (!mostRecent || lastWindow.timestamp > mostRecent.timestamp) {
            mostRecent = { messageID, timestamp: lastWindow.timestamp };
          }
        }
      }
    }
    return mostRecent?.messageID || null;
  }
  hasActiveMessages(sessionID) {
    return this.getMostRecentActiveMessage(sessionID) !== null;
  }
  completeMessage(sessionID, messageID) {
    const key = this.key(sessionID, messageID);
    this.completedMessages.add(key);
    setTimeout(() => {
      this.windows.delete(key);
      this.startTimes.delete(key);
      this.completedMessages.delete(key);
      this.notifyListeners();
    }, 5000);
  }
  resetMessage(sessionID, messageID) {
    const key = this.key(sessionID, messageID);
    this.windows.delete(key);
    this.startTimes.delete(key);
    this.completedMessages.delete(key);
  }
  onUpdate(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  key(sessionID, messageID) {
    return `${sessionID}:${messageID}`;
  }
  notifyListeners() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

// src/sparkline.ts
var BARS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

class SparklineBuffer {
  buffer = [];
  maxSize;
  constructor(maxSize = 30) {
    this.maxSize = maxSize;
  }
  push(value) {
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();
    }
    this.buffer.push(value);
  }
  clear() {
    this.buffer = [];
  }
  get size() {
    return this.buffer.length;
  }
  getBars() {
    const n = this.buffer.length;
    if (n === 0)
      return "";
    let min = Infinity;
    let max = -Infinity;
    for (const v of this.buffer) {
      if (v < min)
        min = v;
      if (v > max)
        max = v;
    }
    const range = max - min;
    if (range === 0)
      return BARS[3].repeat(n);
    return this.buffer.map((v) => BARS[Math.min(7, Math.floor((v - min) / range * 8))]).join("");
  }
  getSlope() {
    const n = this.buffer.length;
    if (n < 2)
      return 0;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    for (let i = 0;i < n; i++) {
      const y = this.buffer[i];
      sumX += i;
      sumY += y;
      sumXY += i * y;
      sumX2 += i * i;
    }
    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0)
      return 0;
    return (n * sumXY - sumX * sumY) / denominator;
  }
  getColor() {
    const slope = this.getSlope();
    if (slope >= -0.5)
      return "#00ff66";
    if (slope <= -2)
      return "#ff4444";
    return "#ffcc00";
  }
}

// src/plugin.ts
var id = "pps-counter";
function formatPPS(pps) {
  const formatted = pps >= 100 ? Math.round(pps).toString() : pps.toFixed(1);
  return ` ${formatted} tok/s`;
}
function getRouteSessionID(route) {
  if (route.name !== "session")
    return null;
  const sessionID = route.params?.sessionID;
  return typeof sessionID === "string" ? sessionID : null;
}
function renderText(content) {
  const element = createElement("text");
  setProp(element, "content", content, undefined);
  return element;
}
var tui = async (api) => {
  const tracker = new PPSTracker(2000);
  const sparkline = new SparklineBuffer(30);
  const [ppsText, setPpsText] = createSignal("");
  const [sparklineText, setSparklineText] = createSignal("");
  const [sparklineColor, setSparklineColor] = createSignal("#00ff66");
  const sessionNextMessageID = "__session_next__";
  const partTextLengths = new Map;
  let pollInterval = null;
  api.ui.toast({
    variant: "info",
    message: "PPS counter loaded",
    duration: 1500
  });
  let pollingSessionID = null;
  function startPolling(sessionID) {
    if (pollingSessionID === sessionID && pollInterval !== null)
      return;
    stopPolling();
    pollingSessionID = sessionID;
    pollInterval = setInterval(() => {
      const messageID = tracker.getMostRecentActiveMessage(sessionID);
      if (!messageID)
        return;
      const pps = tracker.getPPS(sessionID, messageID);
      if (pps > 0) {
        sparkline.push(pps);
        setSparklineText(sparkline.getBars());
        setSparklineColor(sparkline.getColor());
      }
    }, 200);
  }
  function stopPolling() {
    if (pollInterval !== null) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    pollingSessionID = null;
  }
  api.event.on("session.next.text.started", (event) => {
    const { sessionID } = event.properties;
    tracker.resetMessage(sessionID, sessionNextMessageID);
    sparkline.clear();
    setSparklineText("");
    startPolling(sessionID);
  });
  api.event.on("session.next.text.ended", () => {
    stopPolling();
  });
  api.event.on("message.part.delta", (event) => {
    const { sessionID, messageID, field, delta } = event.properties;
    if (!field.endsWith("text") || !delta)
      return;
    if (pollInterval === null) {
      sparkline.clear();
      setSparklineText("");
      setSparklineColor("#00ff66");
      startPolling(sessionID);
    }
    tracker.addDelta(sessionID, messageID, delta);
  });
  api.event.on("session.next.text.delta", (event) => {
    const { sessionID, delta } = event.properties;
    if (!delta)
      return;
    if (pollInterval === null) {
      sparkline.clear();
      setSparklineText("");
      setSparklineColor("#00ff66");
      startPolling(sessionID);
    }
    tracker.addDelta(sessionID, sessionNextMessageID, delta);
  });
  api.event.on("session.next.text.ended", (event) => {
    const { sessionID } = event.properties;
    tracker.completeMessage(sessionID, sessionNextMessageID);
  });
  api.event.on("message.part.updated", (event) => {
    const { part } = event.properties;
    if (part.type !== "text" && part.type !== "reasoning")
      return;
    const previousLength = partTextLengths.get(part.id) ?? 0;
    const nextLength = part.text.length;
    partTextLengths.set(part.id, nextLength);
    if (nextLength <= previousLength)
      return;
    tracker.addDelta(part.sessionID, part.messageID, part.text.slice(previousLength));
  });
  api.event.on("message.updated", (event) => {
    const { info } = event.properties;
    if (info.role !== "assistant" || !info.time.completed)
      return;
    tracker.completeMessage(info.sessionID, info.id);
  });
  tracker.onUpdate(() => {
    const currentRoute = api.route.current;
    const sessionID = getRouteSessionID(currentRoute);
    if (!sessionID) {
      setPpsText("");
      return;
    }
    const messageID = tracker.getMostRecentActiveMessage(sessionID);
    if (!messageID) {
      setPpsText("");
      return;
    }
    const pps = tracker.getPPS(sessionID, messageID);
    if (pps <= 0) {
      setPpsText("");
      return;
    }
    setPpsText(formatPPS(pps));
  });
  api.slots.register({
    slots: {
      session_prompt_right: (_ctx, _props) => {
        const text = ppsText();
        if (!text) {
          return renderText(" -- tok/s");
        }
        const bars = sparklineText();
        const color = sparklineColor();
        const fullContent = bars ? `${bars}${text}` : text;
        const element = createElement("text");
        setProp(element, "content", fullContent, undefined);
        setProp(element, "fg", color, undefined);
        return element;
      }
    }
  });
};
var plugin_default = { id, tui };
export {
  tui,
  id,
  plugin_default as default
};
