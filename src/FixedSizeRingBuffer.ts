/**
 * Fixed-size circular buffer.
 *
 * 1:1 port of the iOS (`FixedSizeRingBuffer.swift`) and Android
 * (`FixedSizeRingBuffer.kt`) helpers. `read()` returns the buffered elements in
 * insertion order, skipping empty slots before the buffer first fills up.
 */
export class FixedSizeRingBuffer<T> {
  private readonly bufferSize: number;
  private buffer: Array<T | undefined>;
  private writeIndex = 0;

  constructor(bufferSize: number) {
    this.bufferSize = bufferSize;
    this.buffer = new Array<T | undefined>(bufferSize);
  }

  enqueue(element: T): void {
    this.buffer[this.writeIndex % this.bufferSize] = element;
    this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
  }

  reset(): void {
    this.writeIndex = 0;
    this.buffer = new Array<T | undefined>(this.bufferSize);
  }

  read(): T[] {
    const out: T[] = [];
    for (let i = this.writeIndex; i < this.bufferSize; i++) {
      const v = this.buffer[i];
      if (v !== undefined) out.push(v);
    }
    for (let i = 0; i < this.writeIndex; i++) {
      const v = this.buffer[i];
      if (v !== undefined) out.push(v);
    }
    return out;
  }
}
