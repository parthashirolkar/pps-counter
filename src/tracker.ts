/**
 * PPS Tracker - Sliding window token rate calculator
 * 
 * Tracks tokens per second using a configurable sliding window.
 * Estimates tokens from character count using char/4 heuristic.
 */

interface TokenWindow {
  timestamp: number;
  tokens: number;
}

export class PPSTracker {
  private windows = new Map<string, TokenWindow[]>();
  private startTimes = new Map<string, number>();
  private completedMessages = new Set<string>();
  private readonly windowSizeMs: number;
  private listeners: Set<() => void> = new Set();

  constructor(windowSizeMs = 2000) {
    this.windowSizeMs = windowSizeMs;
  }

  /**
   * Record a delta for a message
   */
  addDelta(sessionID: string, messageID: string, delta: string): void {
    const now = Date.now();
    const key = this.key(sessionID, messageID);

    if (this.completedMessages.has(key)) return;

    if (!this.startTimes.has(key)) {
      this.startTimes.set(key, now);
    }

    // Estimate tokens: ~4 chars per token
    const estimatedTokens = Math.max(1, Math.ceil(delta.length / 4));

    let windows = this.windows.get(key);
    if (!windows) {
      windows = [];
      this.windows.set(key, windows);
    }

    windows.push({ timestamp: now, tokens: estimatedTokens });

    // Clean old entries outside window
    const cutoff = now - this.windowSizeMs;
    while (windows.length > 0 && windows[0]!.timestamp < cutoff) {
      windows.shift();
    }

    this.notifyListeners();
  }

  /**
   * Get instantaneous PPS over the sliding window
   */
  getPPS(sessionID: string, messageID: string): number {
    const key = this.key(sessionID, messageID);
    const windows = this.windows.get(key);

    if (!windows || windows.length === 0) return 0;

    const now = Date.now();
    const cutoff = now - this.windowSizeMs;
    const relevantWindows = windows.filter(w => w.timestamp >= cutoff);

    if (relevantWindows.length === 0) return 0;

    const totalTokens = relevantWindows.reduce((sum, w) => sum + w.tokens, 0);
    const timeSpan = relevantWindows[relevantWindows.length - 1]!.timestamp - relevantWindows[0]!.timestamp;

    if (timeSpan === 0) {
      // All deltas in same millisecond - extrapolate to 1 second
      return totalTokens * 1000;
    }

    return (totalTokens / timeSpan) * 1000;
  }

  /**
   * Get cumulative average PPS since message start
   */
  getCumulativePPS(sessionID: string, messageID: string): number {
    const key = this.key(sessionID, messageID);
    const windows = this.windows.get(key);
    const startTime = this.startTimes.get(key);

    if (!windows || windows.length === 0 || !startTime) return 0;

    const totalTokens = windows.reduce((sum, w) => sum + w.tokens, 0);
    const elapsed = Date.now() - startTime;

    if (elapsed === 0) return 0;

    return (totalTokens / elapsed) * 1000;
  }

  /**
   * Get the most recently active message for a session
   */
  getMostRecentActiveMessage(sessionID: string): string | null {
    const now = Date.now();
    const cutoff = now - this.windowSizeMs * 2; // 2x window grace period
    let mostRecent: { messageID: string; timestamp: number } | null = null;

    for (const [key, windows] of this.windows) {
      if (key.startsWith(`${sessionID}:`)) {
        const messageID = key.split(':')[1]!;
        if (this.completedMessages.has(key)) continue;

        const lastWindow = windows[windows.length - 1]!;
        if (lastWindow.timestamp >= cutoff) {
          if (!mostRecent || lastWindow.timestamp > mostRecent.timestamp) {
            mostRecent = { messageID, timestamp: lastWindow.timestamp };
          }
        }
      }
    }

    return mostRecent?.messageID || null;
  }

  /**
   * Check if a session has any active (streaming) messages
   */
  hasActiveMessages(sessionID: string): boolean {
    return this.getMostRecentActiveMessage(sessionID) !== null;
  }

  /**
   * Mark a message as completed
   */
  completeMessage(sessionID: string, messageID: string): void {
    const key = this.key(sessionID, messageID);
    this.completedMessages.add(key);
    
    // Clean up after a delay
    setTimeout(() => {
      this.windows.delete(key);
      this.startTimes.delete(key);
      this.completedMessages.delete(key);
      this.notifyListeners();
    }, 5000);
  }

  /**
   * Reset a message's tracking state (for stream restart)
   */
  resetMessage(sessionID: string, messageID: string): void {
    const key = this.key(sessionID, messageID);
    this.windows.delete(key);
    this.startTimes.delete(key);
    this.completedMessages.delete(key);
  }

  /**
   * Subscribe to PPS updates
   */
  onUpdate(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private key(sessionID: string, messageID: string): string {
    return `${sessionID}:${messageID}`;
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
