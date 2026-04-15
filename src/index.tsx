import React from 'react';
import type { QuickPoseViewProps, QuickPoseUpdateEvent } from './types';
import NativeQuickPoseView from './QuickPoseViewNativeComponent';
import { parseFeatureString } from './parseFeature';

export const QuickPoseView: React.FC<QuickPoseViewProps> = ({
  sdkKey,
  features,
  featureStyles,
  useFrontCamera = true,
  style,
  onUpdate,
}) => {
  const handleUpdate = (event: any) => {
    const {resultsJson, feedback} = event.nativeEvent;
    const results = resultsJson ? JSON.parse(resultsJson) : [];
    onUpdate?.({
      nativeEvent: {
        results,
        feedback: feedback || null,
      },
    });
  };

  const parsedFeatures = React.useMemo(() => {
    return features
      .map(f => parseFeatureString(f, featureStyles?.[f]))
      .filter((f): f is NonNullable<typeof f> => f !== null);
  }, [features, featureStyles]);

  return (
    <NativeQuickPoseView
      sdkKey={sdkKey}
      features={parsedFeatures}
      useFrontCamera={useFrontCamera}
      style={style}
      onUpdate={handleUpdate}
    />
  );
};

export { parseFeatureString } from './parseFeature';
export type {
  QuickPoseViewProps,
  QuickPoseUpdateEvent,
  QuickPoseResult,
  QuickPoseStyle,
  QuickPoseConditionalColor,
  QuickPoseEdgeInsets,
  ParsedFeature,
  Side,
  LandmarksGroup,
  ROMJoint,
  FitnessExercise,
} from './types';
