const BARS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

export class SparklineBuffer {
  private buffer: number[] = [];
  private readonly maxSize: number;

  constructor(maxSize = 30) {
    this.maxSize = maxSize;
  }

  push(value: number): void {
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();
    }
    this.buffer.push(value);
  }

  clear(): void {
    this.buffer = [];
  }

  get size(): number {
    return this.buffer.length;
  }

  getBars(): string {
    const n = this.buffer.length;
    if (n === 0) return "";

    let min = Infinity;
    let max = -Infinity;
    for (const v of this.buffer) {
      if (v < min) min = v;
      if (v > max) max = v;
    }

    const range = max - min;
    if (range === 0) return BARS[3]!.repeat(n);

    return this.buffer
      .map((v) => BARS[Math.min(7, Math.floor(((v - min) / range) * 8))])
      .join("");
  }

  getSlope(): number {
    const n = this.buffer.length;
    if (n < 2) return 0;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      const y = this.buffer[i]!;
      sumX += i;
      sumY += y;
      sumXY += i * y;
      sumX2 += i * i;
    }

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return 0;

    return (n * sumXY - sumX * sumY) / denominator;
  }

  getColor(): string {
    const slope = this.getSlope();
    if (slope >= -0.5) return "#00ff66";
    if (slope <= -2.0) return "#ff4444";
    return "#ffcc00";
  }
}
