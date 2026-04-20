import type { ViewStyle, StyleProp } from 'react-native';

// --- String literal types for validated feature configuration ---

export type Side = 'left' | 'right';

export type LandmarksGroup =
  | 'wholeBody' | 'wholeBodyAndHead' | 'upperBody' | 'straightArmsUpperBody'
  | 'toWristsUpperBody' | 'shoulders' | 'arm' | 'armToWrist' | 'armNoElbow'
  | 'straightArm' | 'hand' | 'leg' | 'lowerBody' | 'hips' | 'elbows'
  | 'knees' | 'legs' | 'arms' | 'head';

export type ROMJoint = 'neck' | 'shoulder' | 'elbow' | 'hip' | 'back' | 'knee' | 'ankle';

export type FitnessExercise =
  | 'squats' | 'pushUps' | 'jumpingJacks' | 'sumoSquats' | 'lunges'
  | 'sitUps' | 'cobraWings' | 'plank' | 'plankStraightArm' | 'legRaises'
  | 'gluteBridge' | 'overheadDumbbellPress' | 'vUps' | 'lateralRaises'
  | 'frontRaises' | 'hipAbductionStanding' | 'sideLunges' | 'bicepCurls'
  | 'bicepCurlsSingleArm' | 'overarmReachBilateral' | 'kneeRaisesBilateral';

// --- Parsed feature sent to native as structured JSON ---

export interface ParsedFeature {
  type: string;
  featureKey: string;
  group?: LandmarksGroup;
  side?: Side;
  joint?: ROMJoint;
  exercise?: FitnessExercise;
  clockwise?: boolean;
  darkenCamera?: number;
  edgeInsets?: QuickPoseEdgeInsets;
  style?: QuickPoseStyle;
}

// --- Public API types ---

export type QuickPoseResults = Record<string, number>;
export type QuickPoseFeedbacks = Record<string, string>;

export interface QuickPoseUpdateEvent {
  nativeEvent: {
    results: QuickPoseResults;
    feedbacks: QuickPoseFeedbacks;
    fps: number;
  };
}

export interface QuickPoseConditionalColor {
  min?: number;
  max?: number;
  color: string; // hex e.g. '#FF0000'
}

export interface QuickPoseEdgeInsets {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

export interface QuickPoseStyle {
  color?: string; // hex e.g. '#FFFFFF'
  relativeFontSize?: number;
  relativeArcSize?: number;
  relativeLineWidth?: number;
  cornerRadius?: number;
  hidden?: boolean; // iOS only — hides the overlay rendering
  conditionalColors?: QuickPoseConditionalColor[];
  /** Edge insets for the "inside" feature — values are proportions of the camera view (0-0.5). Defaults to 0.1 on all sides. */
  edgeInsets?: QuickPoseEdgeInsets;
}

export interface QuickPoseViewProps {
  sdkKey: string;
  features: string[];
  featureStyles?: Record<string, QuickPoseStyle>;
  useFrontCamera?: boolean;
  style?: StyleProp<ViewStyle>;
  onUpdate?: (event: QuickPoseUpdateEvent) => void;
}

/**
 * Imperative handle returned by `useRef<QuickPoseViewRef>()` when attached to
 * a `<QuickPoseView ref={...} />`. Lets you grab the current composite camera +
 * overlay frame on demand.
 */
export interface QuickPoseViewRef {
  /**
   * Capture the current camera + overlay frame as a PNG and return a
   * platform-local URI (`file://` on iOS, `content://` on Android) to the
   * written file. Read bytes via `await (await fetch(uri)).arrayBuffer()`.
   */
  captureFrame(): Promise<string>;

  /**
   * Capture the current frame and open the OS share sheet. Resolves once the
   * sheet is presented; the user's choice (sharing to an app / cancelling) is
   * handled by the OS.
   */
  shareFrame(title?: string): Promise<void>;
}
