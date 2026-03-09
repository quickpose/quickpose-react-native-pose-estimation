import React, {useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {QuickPoseView} from '@quickpose/react-native';
import {QUICKPOSE_SDK_KEY} from './sdkConfig';
import type {FeatureItem} from './features';

interface CameraScreenProps {
  feature: FeatureItem;
  onBack: () => void;
}

export default function CameraScreen({feature, onBack}: CameraScreenProps) {
  const [value, setValue] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [counter, setCounter] = useState(0);
  const wasAboveThreshold = useRef(false);

  const isFitness = feature.feature.startsWith('fitness.');
  const isPlank =
    feature.feature === 'fitness.plank' ||
    feature.feature === 'fitness.plankStraightArm';
  const isROM = feature.feature.startsWith('rangeOfMotion.');

  const handleUpdate = useCallback(
    (event: any) => {
      const {results, feedback: fb} = event.nativeEvent;
      if (results && results.length > 0) {
        const v = results[0].value;
        setValue(v);

        if (isFitness && !isPlank) {
          if (v >= 0.5 && !wasAboveThreshold.current) {
            wasAboveThreshold.current = true;
          } else if (v < 0.3 && wasAboveThreshold.current) {
            wasAboveThreshold.current = false;
            setCounter(c => c + 1);
          }
        }
      }
      setFeedback(fb ?? null);
    },
    [isFitness, isPlank],
  );

  return (
    <View style={styles.container}>
      <QuickPoseView
        sdkKey={QUICKPOSE_SDK_KEY}
        features={[feature.feature]}
        featureStyles={
          isROM
            ? {
                [feature.feature]: {
                  conditionalColors: [
                    {min: 40, max: null, color: '#00FF00'},
                  ],
                },
              }
            : undefined
        }
        useFrontCamera={true}
        style={styles.camera}
        onUpdate={handleUpdate}
      />

      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.featureLabel}>{feature.label}</Text>
        <View style={styles.backButton} />
      </SafeAreaView>

      <View style={styles.valueContainer}>
        {isROM && (
          <Text style={styles.valueText}>{Math.round(value)}&deg;</Text>
        )}
        {isFitness && !isPlank && (
          <Text style={styles.valueText}>
            Count: {counter} ({Math.round(value * 100)}%)
          </Text>
        )}
        {isPlank && (
          <Text style={styles.valueText}>
            Hold: {Math.round(value * 100)}%
          </Text>
        )}
        {!isROM && !isFitness && (
          <Text style={styles.valueText}>
            {typeof value === 'number' ? value.toFixed(2) : value}
          </Text>
        )}

        {isFitness && (
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {width: `${Math.min(value * 100, 100)}%`},
              ]}
            />
          </View>
        )}
      </View>

      {feedback && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      )}

      <View style={styles.featureStringContainer}>
        <Text style={styles.featureStringText}>{feature.feature}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  featureLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  valueContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  valueText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5970F6',
    borderRadius: 4,
  },
  feedbackContainer: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(89,112,246,0.85)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  feedbackText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  featureStringContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  featureStringText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
