import React, {useRef, useState, useCallback} from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';
import {QuickPoseView, QuickPoseThresholdCounter} from '@quickpose/react-native';
import {QUICKPOSE_SDK_KEY} from './sdkConfig';

const EXERCISE = 'fitness.pushUps';
const FEATURES = [EXERCISE, 'overlay.wholeBody'];

const App = () => {
  const counter = useRef(new QuickPoseThresholdCounter());
  const [count, setCount] = useState(0);
  const [measure, setMeasure] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleUpdate = useCallback((event: any) => {
    const {results, feedback: fb} = event.nativeEvent;
    const prompt = fb && fb.length > 0 ? fb : null;
    setFeedback(prompt);

    const v = results?.find((r: any) => r.feature === EXERCISE)?.value;
    if (typeof v === 'number') {
      setMeasure(v);
      if (prompt === null) {
        const state = counter.current.count(v);
        setCount(state.count);
      }
    }
  }, []);

  return (
    <View style={styles.container}>
      <QuickPoseView
        sdkKey={QUICKPOSE_SDK_KEY}
        features={FEATURES}
        useFrontCamera={true}
        style={styles.camera}
        onUpdate={handleUpdate}
      />

      <SafeAreaView style={styles.overlay} pointerEvents="none">
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
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'black'},
  camera: {flex: 1},
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
});

export default App;
