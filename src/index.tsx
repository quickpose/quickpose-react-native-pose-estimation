import React from 'react';
import type { QuickPoseViewProps, QuickPoseUpdateEvent } from './types';
import NativeQuickPoseView from './QuickPoseViewNativeComponent';

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

  const stylesJson = featureStyles ? JSON.stringify(featureStyles) : undefined;

  return (
    <NativeQuickPoseView
      sdkKey={sdkKey}
      features={features}
      stylesJson={stylesJson}
      useFrontCamera={useFrontCamera}
      style={style}
      onUpdate={handleUpdate}
    />
  );
};

export type { QuickPoseViewProps, QuickPoseUpdateEvent, QuickPoseResult, QuickPoseStyle, QuickPoseConditionalColor } from './types';
