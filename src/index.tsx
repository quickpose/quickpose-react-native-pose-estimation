import React from 'react';
import type { QuickPoseViewProps, QuickPoseUpdateEvent } from './types';
import NativeQuickPoseView from './QuickPoseViewNativeComponent';

export const QuickPoseView: React.FC<QuickPoseViewProps> = ({
  sdkKey,
  features,
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

  return (
    <NativeQuickPoseView
      sdkKey={sdkKey}
      features={features}
      useFrontCamera={useFrontCamera}
      style={style}
      onUpdate={handleUpdate}
    />
  );
};

export type { QuickPoseViewProps, QuickPoseUpdateEvent, QuickPoseResult } from './types';
