import type { TuiPlugin, TuiRouteCurrent } from "@opencode-ai/plugin/tui";
import { createElement, setProp } from "@opentui/solid";
import { createSignal } from "solid-js";
import { PPSTracker } from "./tracker";
import { SparklineBuffer } from "./sparkline";

export const id = "pps-counter";

function formatPPS(pps: number): string {
  const formatted = pps >= 100 ? Math.round(pps).toString() : pps.toFixed(1);
  return ` ${formatted} tok/s`;
}

function getRouteSessionID(route: TuiRouteCurrent): string | null {
  if (route.name !== "session") return null;

  const sessionID = route.params?.sessionID;
  return typeof sessionID === "string" ? sessionID : null;
}

function renderText(content: string) {
  const element = createElement("text");
  setProp(element, "content", content, undefined);
  return element;
}

export const tui: TuiPlugin = async (api) => {
  const tracker = new PPSTracker(2000);
  const sparkline = new SparklineBuffer(30);
  const [ppsText, setPpsText] = createSignal<string>("");
  const [sparklineText, setSparklineText] = createSignal<string>("");
  const [sparklineColor, setSparklineColor] = createSignal<string>("#00ff66");
  const sessionNextMessageID = "__session_next__";
  const partTextLengths = new Map<string, number>();
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  api.ui.toast({
    variant: "info",
    message: "PPS counter loaded",
    duration: 1500,
  });

  let pollingSessionID: string | null = null;

  // --- Sparkline polling ---
  function startPolling(sessionID: string): void {
    if (pollingSessionID === sessionID && pollInterval !== null) return;
    stopPolling();
    pollingSessionID = sessionID;
    pollInterval = setInterval(() => {
      const messageID = tracker.getMostRecentActiveMessage(sessionID);
      if (!messageID) return;
      const pps = tracker.getPPS(sessionID, messageID);
      if (pps > 0) {
        sparkline.push(pps);
        setSparklineText(sparkline.getBars());
        setSparklineColor(sparkline.getColor());
      }
    }, 200);
  }

  function stopPolling(): void {
    if (pollInterval !== null) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    pollingSessionID = null;
  }

  // --- Stream lifecycle ---
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

  // --- Streaming delta tracking ---
  api.event.on("message.part.delta", (event) => {
    const { sessionID, messageID, field, delta } = event.properties;
    if (!field.endsWith("text") || !delta) return;

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
    if (!delta) return;

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
    if (part.type !== "text" && part.type !== "reasoning") return;

    const previousLength = partTextLengths.get(part.id) ?? 0;
    const nextLength = part.text.length;
    partTextLengths.set(part.id, nextLength);

    if (nextLength <= previousLength) return;

    tracker.addDelta(part.sessionID, part.messageID, part.text.slice(previousLength));
  });

  api.event.on("message.updated", (event) => {
    const { info } = event.properties;
    if (info.role !== "assistant" || !info.time.completed) return;

    tracker.completeMessage(info.sessionID, info.id);
  });

  // --- PPS text updates from tracker ---
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

  // --- Slot render ---
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
      },
    },
  });
};

export default { id, tui };
