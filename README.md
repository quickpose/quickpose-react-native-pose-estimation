# @quickpose/react-native

React Native plugin for [QuickPose](https://quickpose.ai) ML pose estimation SDK. Provides real-time body tracking, fitness rep counting, range of motion measurement, and skeleton overlays on iOS and Android.

![](img/react-native-demo.jpg)

## Installation

```bash
npm install @quickpose/react-native
```

### iOS Setup

```bash
cd ios && pod install
```

The podspec automatically pulls QuickPose iOS pods (QuickPoseCore, QuickPoseCamera, QuickPoseSwiftUI).

### Android Setup

No extra steps — Gradle resolves QuickPose + CameraX dependencies automatically.

### SDK Key

Register for a free SDK key at [https://dev.quickpose.ai](https://dev.quickpose.ai).

## Usage

```tsx
import { QuickPoseView } from '@quickpose/react-native';

<QuickPoseView
  sdkKey="your-key-here"
  features={['overlay.wholeBody']}
  useFrontCamera={true}
  style={{ flex: 1 }}
  onUpdate={(event) => {
    const { results, feedback } = event.nativeEvent;
    // results = [{ feature: string, value: number }]
    // feedback = string | null
  }}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sdkKey` | `string` | *required* | Your QuickPose SDK key |
| `features` | `string[]` | *required* | Feature identifiers to activate |
| `useFrontCamera` | `boolean` | `true` | Use front-facing camera |
| `style` | `ViewStyle` | — | Standard React Native style |
| `onUpdate` | `(event) => void` | — | Called each frame with results and feedback |

## Feature Strings

### Overlay
| String | Description |
|--------|-------------|
| `overlay.wholeBody` | Full body skeleton |
| `overlay.upperBody` | Shoulders, arms, hips |
| `overlay.lowerBody` | Hips, legs |
| `overlay.arm.left` | Left arm |
| `overlay.arm.right` | Right arm |
| `overlay.leg.left` | Left leg |
| `overlay.leg.right` | Right leg |
| `overlay.shoulders` | Shoulders |
| `overlay.arms` | Both arms |
| `overlay.legs` | Both legs |
| `overlay.hips` | Hips |
| `showPoints` | All 33 body landmarks |

### Range of Motion
| String | Description |
|--------|-------------|
| `rangeOfMotion.shoulder.left` | Left shoulder rotation |
| `rangeOfMotion.shoulder.right` | Right shoulder rotation |
| `rangeOfMotion.elbow.left` | Left elbow |
| `rangeOfMotion.elbow.right` | Right elbow |
| `rangeOfMotion.hip.left` | Left hip |
| `rangeOfMotion.hip.right` | Right hip |
| `rangeOfMotion.knee.left` | Left knee |
| `rangeOfMotion.knee.right` | Right knee |
| `rangeOfMotion.neck` | Neck |
| `rangeOfMotion.back` | Back |

### Fitness
| String | Description |
|--------|-------------|
| `fitness.squats` | Squats |
| `fitness.pushUps` | Push ups |
| `fitness.jumpingJacks` | Jumping jacks |
| `fitness.sumoSquats` | Sumo squats |
| `fitness.lunges.left` | Left leg lunges |
| `fitness.lunges.right` | Right leg lunges |
| `fitness.sitUps` | Sit ups |
| `fitness.cobraWings` | Cobra wings |
| `fitness.plank` | Plank hold |
| `fitness.bicepCurls` | Bicep curls |
| `fitness.legRaises` | Leg raises |
| `fitness.gluteBridge` | Glute bridge |
| `fitness.overheadDumbbellPress` | Overhead dumbbell press |
| `fitness.vUps` | V-ups |
| `fitness.lateralRaises` | Lateral raises |
| `fitness.frontRaises` | Front raises |
| `fitness.sideLunges.left` | Side lunges (left) |
| `fitness.sideLunges.right` | Side lunges (right) |

### Input / Gestures
| String | Description |
|--------|-------------|
| `raisedFingers` | Detect raised fingers |
| `thumbsUp` | Detect thumbs up |
| `thumbsUpOrDown` | Detect thumbs up or down |

Side variants: append `.left` or `.right` (e.g. `raisedFingers.left`).

## Example Apps

Each example is a complete React Native app that depends on `@quickpose/react-native` via `"file:.."` (local symlink). No npm publish required to run them.

### Prerequisites

- [React Native environment setup](https://reactnative.dev/docs/environment-setup) (Xcode, Android Studio, etc.)
- CocoaPods (`gem install cocoapods`)
- A free SDK key from [https://dev.quickpose.ai](https://dev.quickpose.ai)
- Physical device for camera access (iOS Simulator / Android Emulator won't work)

### Running an example

```bash
# 1. Install JS dependencies
cd example-basic
npm install

# 2. Add your SDK key in App.tsx (replace "YOUR SDK KEY HERE")

# 3. iOS
cd ios && pod install && cd ..
npx react-native run-ios --device

# 4. Android (physical device connected via USB)
npx react-native run-android
```

### example-basic/
Minimal demo — whole body overlay in ~50 lines of React Native code. Mirrors the native iOS BasicDemo.

### example-feedback/
Fitness exercise with real-time feedback text and progress bar. Demonstrates `fitness.frontRaises` with the `onUpdate` callback. Mirrors the native iOS FeedbackDemo.

### example-picker/
Full feature picker with category menus, rep counter, and hold timer. Browse all overlay, ROM, fitness, and input features at runtime. Mirrors the native iOS/Android PickerDemo.

### example-manual-bridge/
The original AwesomeProject — a manual bridge reference for users who want full control over the native bridge code. Does not use the plugin; bridge files are embedded directly in the app.

## Requirements

- React Native >= 0.60
- iOS 15+
- Android SDK 26+ (physical device required for camera)

## Links

- iOS SDK: [https://github.com/quickpose/quickpose-ios-sdk](https://github.com/quickpose/quickpose-ios-sdk)
- Android SDK: [https://github.com/quickpose/quickpose-android-sdk](https://github.com/quickpose/quickpose-android-sdk)
- Documentation: [https://docs.quickpose.ai](https://docs.quickpose.ai)
- SDK Keys: [https://dev.quickpose.ai](https://dev.quickpose.ai)
