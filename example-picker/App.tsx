import React, {useState} from 'react';
import FeaturePickerScreen from './FeaturePickerScreen';
import CameraScreen from './CameraScreen';
import type {FeatureItem} from './features';

const App = () => {
  const [selectedFeature, setSelectedFeature] = useState<FeatureItem | null>(
    null,
  );

  if (selectedFeature) {
    return (
      <CameraScreen
        feature={selectedFeature}
        onBack={() => setSelectedFeature(null)}
      />
    );
  }

  return <FeaturePickerScreen onSelectFeature={setSelectedFeature} />;
};

export default App;
