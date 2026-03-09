import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import {FEATURE_CATEGORIES} from './features';
import type {FeatureItem} from './features';

interface FeaturePickerScreenProps {
  onSelectFeature: (feature: FeatureItem) => void;
}

export default function FeaturePickerScreen({
  onSelectFeature,
}: FeaturePickerScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>QuickPose Features</Text>
      <FlatList
        data={FEATURE_CATEGORIES}
        keyExtractor={item => item.name}
        renderItem={({item: category}) => (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            {category.features.map(feature => (
              <TouchableOpacity
                key={feature.feature}
                style={styles.featureItem}
                onPress={() => onSelectFeature(feature)}>
                <Text style={styles.featureLabel}>{feature.label}</Text>
                <Text style={styles.featureString}>{feature.feature}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a2e',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  categorySection: {
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5970F6',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  featureItem: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8e8e8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  featureString: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginLeft: 8,
  },
});
