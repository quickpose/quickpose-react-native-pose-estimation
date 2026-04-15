# example-counter

Minimal sample showing how to gate rep counting on the SDK's pose-check
feedback — so counting only starts once the user is in the correct starting
pose for the exercise.

Mirrors the iOS `CounterDemo` and Android `composeapp` patterns.

## How it works

The QuickPose SDK runs per-exercise pose checks every frame. When the user
isn't in the required starting pose (e.g. not floor-facing for push-ups), the
SDK surfaces a `feedback` string via `onUpdate`. While that feedback is
non-empty, we simply don't feed the measure value into the counter:

```tsx
const counter = useRef(new QuickPoseThresholdCounter());

const handleUpdate = (event) => {
  const {results, feedback} = event.nativeEvent;
  const measure = results?.find(r => r.feature === 'fitness.pushUps')?.value;

  if (!feedback && typeof measure === 'number') {
    const state = counter.current.count(measure);
    setCount(state.count);
  }
};
```

That's identical to the iOS/Android samples. The two-threshold hysteresis
inside `QuickPoseThresholdCounter` (enter 0.6, exit 0.3) handles noise; not
calling `count()` while feedback is present is what prevents false reps
during setup.

## Adding a "GO" audio cue

The first time `counter.state.isEntered` flips to `true` is the exact moment
the user starts their first rep. Hook your audio library there — Expo apps
typically use `expo-av` / `expo-audio`; bare RN can use `react-native-sound`.

```tsx
const state = counter.current.count(measure);
if (state.type === 'poseEntered' && state.count === 0 && !hasPlayedGo.current) {
  hasPlayedGo.current = true;
  playGoSound();
}
```

## Running

```bash
npm install
# Android
(cd android && ./gradlew :app:assembleDebug)
# iOS
(cd ios && pod install)
```

Put your SDK key in `sdkConfig.ts` (get one at https://dev.quickpose.ai).
