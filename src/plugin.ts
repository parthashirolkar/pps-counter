import type { TuiPlugin, TuiRouteCurrent } from "@opencode-ai/plugin/tui";
import { createElement, setProp } from "@opentui/solid";
import { createSignal } from "solid-js";
import { PPSTracker } from "./tracker";

export const id = "pps-counter";

function formatPPS(pps: number): string {
  const formatted = pps >= 100 ? Math.round(pps).toString() : pps.toFixed(1);
  return ` ⚡ ${formatted} tok/s`;
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
  const [ppsText, setPpsText] = createSignal<string>("");
  const sessionNextMessageID = "__session_next__";
  const partTextLengths = new Map<string, number>();

  api.ui.toast({
    variant: "info",
    message: "PPS counter loaded",
    duration: 1500,
  });

  // Listen for streaming deltas
  api.event.on("message.part.delta", (event) => {
    const { sessionID, messageID, field, delta } = event.properties;
    if (!field.endsWith("text") || !delta) return;

    tracker.addDelta(sessionID, messageID, delta);
  });

  api.event.on("session.next.text.delta", (event) => {
    const { sessionID, delta } = event.properties;
    if (!delta) return;

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

  // Listen for message completion
  api.event.on("message.updated", (event) => {
    const { info } = event.properties;
    if (info.role !== "assistant" || !info.time.completed) return;

    tracker.completeMessage(info.sessionID, info.id);
  });

  // Update PPS display whenever tracker updates
  tracker.onUpdate(() => {
    const currentRoute = api.route.current;
    const sessionID = getRouteSessionID(currentRoute);
    if (!sessionID) {
      setPpsText("");
      return;
    }

    const hasActive = tracker.hasActiveMessages(sessionID);
    if (!hasActive) {
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

  // Register slot
  api.slots.register({
    slots: {
      session_prompt_right: (_ctx, _props) => {
        const text = ppsText();
        return renderText(text || " ⚡ -- tok/s");
      },
    },
  });
};

export default { id, tui };
