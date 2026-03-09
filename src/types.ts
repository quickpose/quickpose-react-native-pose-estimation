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

export interface QuickPoseViewProps {
  sdkKey: string;
  features: string[];
  useFrontCamera?: boolean;
  style?: StyleProp<ViewStyle>;
  onUpdate?: (event: QuickPoseUpdateEvent) => void;
}
