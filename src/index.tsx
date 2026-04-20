import React from 'react';
import {NativeModules, findNodeHandle} from 'react-native';
import type {QuickPoseViewProps, QuickPoseViewRef} from './types';
import NativeQuickPoseView from './QuickPoseViewNativeComponent';
import {parseFeatureString} from './parseFeature';

const {QuickPoseCaptureModule} = NativeModules;

export const QuickPoseView = React.forwardRef<QuickPoseViewRef, QuickPoseViewProps>(
  ({sdkKey, features, featureStyles, useFrontCamera = true, style, onUpdate}, ref) => {
    const nativeRef = React.useRef<React.ElementRef<typeof NativeQuickPoseView>>(null);

    const handleUpdate = (event: any) => {
      const {resultsJson, feedback, fps} = event.nativeEvent;
      const results = resultsJson ? JSON.parse(resultsJson) : [];
      onUpdate?.({
        nativeEvent: {
          results,
          feedback: feedback || null,
          fps: typeof fps === 'number' ? fps : 0,
        },
      });
    };

    const parsedFeatures = React.useMemo(() => {
      return features
        .map(f => parseFeatureString(f, featureStyles?.[f]))
        .filter((f): f is NonNullable<typeof f> => f !== null);
    }, [features, featureStyles]);

    React.useImperativeHandle(
      ref,
      () => ({
        async captureFrame() {
          const tag = findNodeHandle(nativeRef.current);
          if (tag == null) throw new Error('QuickPoseView is not mounted');
          if (!QuickPoseCaptureModule) {
            throw new Error(
              'QuickPoseCaptureModule is not available. Re-run pod install on iOS or rebuild on Android.',
            );
          }
          return await QuickPoseCaptureModule.captureFrame(tag);
        },
        async shareFrame(title?: string) {
          const tag = findNodeHandle(nativeRef.current);
          if (tag == null) throw new Error('QuickPoseView is not mounted');
          if (!QuickPoseCaptureModule) {
            throw new Error(
              'QuickPoseCaptureModule is not available. Re-run pod install on iOS or rebuild on Android.',
            );
          }
          await QuickPoseCaptureModule.shareFrame(tag, title ?? null);
        },
      }),
      [],
    );

    return (
      <NativeQuickPoseView
        ref={nativeRef}
        sdkKey={sdkKey}
        features={parsedFeatures}
        useFrontCamera={useFrontCamera}
        style={style}
        onUpdate={handleUpdate}
      />
    );
  },
);

export {QuickPoseThresholdCounter} from './QuickPoseThresholdCounter';
export type {CountState} from './QuickPoseThresholdCounter';
export {FixedSizeRingBuffer} from './FixedSizeRingBuffer';
export type {
  QuickPoseViewProps,
  QuickPoseViewRef,
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
