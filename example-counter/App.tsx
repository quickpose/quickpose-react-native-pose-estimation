import React, {useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Image,
  Modal,
} from 'react-native';
import {
  QuickPoseView,
  QuickPoseThresholdCounter,
  type QuickPoseViewRef,
} from '@quickpose/react-native';
import {QUICKPOSE_SDK_KEY} from './sdkConfig';

const EXERCISE = 'fitness.pushUps';
const FEATURES = [EXERCISE, 'overlay.wholeBody', 'inside.wholeBody'];
const FEATURE_STYLES = {
  'inside.wholeBody': {
    edgeInsets: {top: 0.05, left: 0.05, bottom: 0.05, right: 0.05},
    relativeLineWidth: 2.0,
    cornerRadius: 16,
    color: '#EF4444',
    conditionalColors: [{min: 0.95, color: '#22C55E'}],
  },
};

const App = () => {
  const quickposeRef = useRef<QuickPoseViewRef>(null);
  const counter = useRef(new QuickPoseThresholdCounter());
  const [count, setCount] = useState(0);
  const [measure, setMeasure] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [snapshotUri, setSnapshotUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const handleUpdate = useCallback((event: any) => {
    const {results, feedbacks, fps: newFps} = event.nativeEvent;
    // Gate counting on the exercise's own feedback only, not inside.wholeBody —
    // so the red/green box doesn't flap the counter as the user drifts near
    // the edge of frame.
    const formFeedback = feedbacks?.[EXERCISE];
    const prompt = formFeedback || feedbacks?.['inside.wholeBody'] || null;
    setFeedback(prompt);
    if (typeof newFps === 'number') setFps(newFps);

    const v = results?.[EXERCISE];
    if (typeof v === 'number') {
      setMeasure(v);
      if (!formFeedback) {
        const state = counter.current.count(v);
        setCount(state.count);
      }
    }
  }, []);

  const onSnapshot = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      const uri = await quickposeRef.current?.captureFrame();
      if (uri) setSnapshotUri(uri);
    } catch (e) {
      console.warn('captureFrame failed', e);
    } finally {
      setCapturing(false);
    }
  }, [capturing]);

  return (
    <View style={styles.container}>
      <QuickPoseView
        ref={quickposeRef}
        sdkKey={QUICKPOSE_SDK_KEY}
        features={FEATURES}
        featureStyles={FEATURE_STYLES}
        useFrontCamera={true}
        style={styles.camera}
        onUpdate={handleUpdate}
      />

      <SafeAreaView style={styles.topBar} pointerEvents="none">
        <Text style={styles.fps}>{fps} fps</Text>
      </SafeAreaView>

      <SafeAreaView style={styles.overlay}>
        {feedback ? (
          <Text style={styles.prompt}>{feedback}</Text>
        ) : (
          <Text style={styles.count}>Reps: {count}</Text>
        )}
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              {width: `${Math.round(Math.min(Math.max(measure, 0), 1) * 100)}%`},
            ]}
          />
        </View>
        <Pressable
          style={[styles.snapshotBtn, capturing && styles.snapshotBtnBusy]}
          onPress={onSnapshot}
          disabled={capturing}>
          <Text style={styles.snapshotBtnText}>
            {capturing ? 'Capturing…' : 'Snapshot'}
          </Text>
        </Pressable>
      </SafeAreaView>

      <Modal
        visible={snapshotUri != null}
        transparent
        animationType="fade"
        onRequestClose={() => setSnapshotUri(null)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSnapshotUri(null)}>
          {snapshotUri && (
            <Image source={{uri: snapshotUri}} style={styles.modalImage} resizeMode="contain" />
          )}
          <Text style={styles.modalHint}>Tap to dismiss</Text>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'black'},
  camera: {flex: 1},
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    paddingHorizontal: 16,
  },
  fps: {
    color: '#00FF88',
    fontSize: 14,
    fontFamily: 'Courier',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  prompt: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: 'rgba(89,112,246,0.85)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    textAlign: 'center',
  },
  count: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
    marginBottom: 12,
  },
  barBackground: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#5970F6',
    borderRadius: 4,
  },
  snapshotBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#5970F6',
  },
  snapshotBtnBusy: {
    backgroundColor: '#3B4CB8',
  },
  snapshotBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '90%',
    height: '70%',
  },
  modalHint: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 20,
    fontSize: 14,
  },
});

export default App;
