import type { ViewStyle, StyleProp } from 'react-native';

export interface QuickPoseResult {
  feature: string;
  value: number;
}

export interface QuickPoseUpdateEvent {
  nativeEvent: {
    results: QuickPoseResult[];
    feedback: string | null;
  };
}

export interface QuickPoseConditionalColor {
  min: number | null;
  max: number | null;
  color: string; // hex e.g. '#FF0000'
}

export interface QuickPoseStyle {
  color?: string; // hex e.g. '#FFFFFF'
  relativeFontSize?: number;
  relativeArcSize?: number;
  relativeLineWidth?: number;
  cornerRadius?: number;
  conditionalColors?: QuickPoseConditionalColor[];
}

export interface QuickPoseViewProps {
  sdkKey: string;
  features: string[];
  featureStyles?: Record<string, QuickPoseStyle>;
  useFrontCamera?: boolean;
  style?: StyleProp<ViewStyle>;
  onUpdate?: (event: QuickPoseUpdateEvent) => void;
}
