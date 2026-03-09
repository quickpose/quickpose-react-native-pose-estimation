import React, {useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  Linking,
} from 'react-native';
import {QuickPoseView} from '@quickpose/react-native';
import {QUICKPOSE_SDK_KEY} from './sdkConfig';

const FEATURE_CATEGORIES: Record<string, {label: string; feature: string}[]> = {
  Overlay: [
    {label: 'Whole Body', feature: 'overlay.wholeBody'},
    {label: 'Upper Body', feature: 'overlay.upperBody'},
    {label: 'Lower Body', feature: 'overlay.lowerBody'},
    {label: 'Left Arm', feature: 'overlay.arm.left'},
    {label: 'Right Arm', feature: 'overlay.arm.right'},
    {label: 'Left Leg', feature: 'overlay.leg.left'},
    {label: 'Right Leg', feature: 'overlay.leg.right'},
    {label: 'Shoulders', feature: 'overlay.shoulders'},
    {label: 'Arms', feature: 'overlay.arms'},
    {label: 'Legs', feature: 'overlay.legs'},
    {label: 'Hips', feature: 'overlay.hips'},
    {label: 'Show Points', feature: 'showPoints'},
  ],
  'Range of Motion': [
    {label: 'Left Shoulder', feature: 'rangeOfMotion.shoulder.left'},
    {label: 'Right Shoulder', feature: 'rangeOfMotion.shoulder.right'},
    {label: 'Left Elbow', feature: 'rangeOfMotion.elbow.left'},
    {label: 'Right Elbow', feature: 'rangeOfMotion.elbow.right'},
    {label: 'Left Hip', feature: 'rangeOfMotion.hip.left'},
    {label: 'Right Hip', feature: 'rangeOfMotion.hip.right'},
    {label: 'Left Knee', feature: 'rangeOfMotion.knee.left'},
    {label: 'Right Knee', feature: 'rangeOfMotion.knee.right'},
    {label: 'Neck', feature: 'rangeOfMotion.neck'},
    {label: 'Back', feature: 'rangeOfMotion.back'},
  ],
  Fitness: [
    {label: 'Squats', feature: 'fitness.squats'},
    {label: 'Push Ups', feature: 'fitness.pushUps'},
    {label: 'Jumping Jacks', feature: 'fitness.jumpingJacks'},
    {label: 'Sumo Squats', feature: 'fitness.sumoSquats'},
    {label: 'Lunges (Left)', feature: 'fitness.lunges.left'},
    {label: 'Lunges (Right)', feature: 'fitness.lunges.right'},
    {label: 'Sit Ups', feature: 'fitness.sitUps'},
    {label: 'Cobra Wings', feature: 'fitness.cobraWings'},
    {label: 'Plank', feature: 'fitness.plank'},
    {label: 'Bicep Curls', feature: 'fitness.bicepCurls'},
    {label: 'Leg Raises', feature: 'fitness.legRaises'},
    {label: 'Glute Bridge', feature: 'fitness.gluteBridge'},
    {label: 'Overhead Dumbbell Press', feature: 'fitness.overheadDumbbellPress'},
    {label: 'V-Ups', feature: 'fitness.vUps'},
    {label: 'Lateral Raises', feature: 'fitness.lateralRaises'},
    {label: 'Front Raises', feature: 'fitness.frontRaises'},
    {label: 'Side Lunges (Left)', feature: 'fitness.sideLunges.left'},
    {label: 'Side Lunges (Right)', feature: 'fitness.sideLunges.right'},
  ],
  Input: [
    {label: 'Raised Fingers', feature: 'raisedFingers'},
    {label: 'Thumbs Up', feature: 'thumbsUp'},
    {label: 'Thumbs Up/Down', feature: 'thumbsUpOrDown'},
  ],
};

const CATEGORY_NAMES = Object.keys(FEATURE_CATEGORIES);

const App = () => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_NAMES[0]);
  const [selectedFeatureIdx, setSelectedFeatureIdx] = useState(0);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showFeaturePicker, setShowFeaturePicker] = useState(false);
  const [value, setValue] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [counter, setCounter] = useState(0);
  const wasAboveThreshold = useRef(false);

  const features = FEATURE_CATEGORIES[selectedCategory];
  const currentFeature = features[selectedFeatureIdx];
  const isFitness = currentFeature.feature.startsWith('fitness.');
  const isPlank = currentFeature.feature === 'fitness.plank';
  const isROM = currentFeature.feature.startsWith('rangeOfMotion.');

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

  const selectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedFeatureIdx(0);
    setValue(0);
    setCounter(0);
    setFeedback(null);
    wasAboveThreshold.current = false;
    setShowCategoryPicker(false);
  };

  const selectFeature = (idx: number) => {
    setSelectedFeatureIdx(idx);
    setValue(0);
    setCounter(0);
    setFeedback(null);
    wasAboveThreshold.current = false;
    setShowFeaturePicker(false);
  };

  return (
    <View style={styles.container}>
      <QuickPoseView
        sdkKey={QUICKPOSE_SDK_KEY}
        features={[currentFeature.feature]}
        useFrontCamera={true}
        style={styles.camera}
        onUpdate={handleUpdate}
      />

      <SafeAreaView style={styles.topControls}>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCategoryPicker(true)}>
          <Text style={styles.pickerButtonText}>{selectedCategory}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowFeaturePicker(true)}>
          <Text style={styles.pickerButtonText}>{currentFeature.label}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.valueContainer}>
        {isROM && (
          <Text style={styles.valueText}>{Math.round(value)}°</Text>
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

      <SafeAreaView style={styles.bottomBranding}>
        <TouchableOpacity onPress={() => Linking.openURL('https://quickpose.ai')}>
          <Text style={styles.brandingText}>Powered by QuickPose.ai</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={CATEGORY_NAMES}
              keyExtractor={item => item}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    item === selectedCategory && styles.modalItemSelected,
                  ]}
                  onPress={() => selectCategory(item)}>
                  <Text
                    style={[
                      styles.modalItemText,
                      item === selectedCategory && styles.modalItemTextSelected,
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowCategoryPicker(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showFeaturePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedCategory}</Text>
            <FlatList
              data={features}
              keyExtractor={item => item.feature}
              renderItem={({item, index}) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    index === selectedFeatureIdx && styles.modalItemSelected,
                  ]}
                  onPress={() => selectFeature(index)}>
                  <Text
                    style={[
                      styles.modalItemText,
                      index === selectedFeatureIdx &&
                        styles.modalItemTextSelected,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowFeaturePicker(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  pickerButton: {
    backgroundColor: '#5970F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  pickerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  valueContainer: {
    position: 'absolute',
    bottom: 80,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  modalItemSelected: {
    backgroundColor: '#eef0fe',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemTextSelected: {
    color: '#5970F6',
    fontWeight: '600',
  },
  modalClose: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#999',
  },
  bottomBranding: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 12,
  },
  brandingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default App;
