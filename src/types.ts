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
  | 'squats' | 'pushUps' | 'frontPushUps' | 'jumpingJacks' | 'sumoSquats' | 'lunges'
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

export type QuickPoseLineCap = 'round' | 'butt' | 'square';

export type QuickPoseLinePattern = 'solid' | 'dashed' | 'dotted';

/**
 * Drop shadow behind lines, points and labels. `radius` is the blur in pixels;
 * `offsetX`/`offsetY` move the shadow right/down on screen. A zero offset with
 * the line's own color renders as a glow.
 */
export interface QuickPoseShadow {
  color?: string; // hex, default '#000000'
  radius?: number; // blur in px, default 4
  offsetX?: number; // default 0
  offsetY?: number; // default 2
}

/**
 * Contrasting border behind lines and points. `relativeWidth` is relative to
 * the default line width, added on each side.
 */
export interface QuickPoseOutline {
  color?: string; // hex, default '#000000'
  relativeWidth?: number; // default 0.25
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
  /** Shape of line endings and joins between limb segments. Default 'round'. */
  lineCap?: QuickPoseLineCap;
  /** Stroke pattern for lines and arcs; dash lengths scale with the line width. Default 'solid'. */
  linePattern?: QuickPoseLinePattern;
  shadow?: QuickPoseShadow;
  outline?: QuickPoseOutline;
  /**
   * Image revealed through the overlay's lines, points and labels, scaled to
   * fill the camera frame — the skeleton acts as a mask. Pass a URI: use
   * `Image.resolveAssetSource(require('./flames.png')).uri` for a bundled
   * asset, or a `file://` path.
   */
  imageFill?: string;
  /**
   * Font face for measurement labels: a PostScript/family name on iOS, a
   * family name or `assets/fonts/<name>.ttf` file name on Android. Size is
   * always 80 scaled by `relativeFontSize`.
   */
  fontName?: string;
  /** Letter spacing for measurement labels in ems (fraction of the text size). */
  letterSpacing?: number;
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
