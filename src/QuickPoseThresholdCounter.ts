/**
 * Counts the number of times a probability score crosses the entry and exit thresholds.
 *
 * 1:1 port of the iOS (`QuickPoseThresholdCounter.swift`) and Android
 * (`QuickPoseThresholdCounter.kt`) helpers — same class name, same defaults,
 * same public surface.
 */

export type CountState =
  | { readonly type: 'poseEntered'; readonly count: number; readonly isEntered: true }
  | { readonly type: 'poseComplete'; readonly count: number; readonly isEntered: false };

const poseEntered = (count: number): CountState => ({ type: 'poseEntered', count, isEntered: true });
const poseComplete = (count: number): CountState => ({ type: 'poseComplete', count, isEntered: false });

export class QuickPoseThresholdCounter {
  readonly enterThreshold: number;
  readonly exitThreshold: number;
  state: CountState = poseComplete(0);

  constructor(enterThreshold = 0.6, exitThreshold = 0.3) {
    this.enterThreshold = enterThreshold;
    this.exitThreshold = exitThreshold;
  }

  count(value: number, onChange?: (state: CountState) => void): CountState {
    if (!this.state.isEntered && value > this.enterThreshold) {
      this.state = poseEntered(this.state.count);
      onChange?.(this.state);
    } else if (this.state.isEntered && value < this.exitThreshold) {
      this.state = poseComplete(this.state.count + 1);
      onChange?.(this.state);
    }
    return this.state;
  }

  reset(): void {
    this.state = poseComplete(0);
  }
}
