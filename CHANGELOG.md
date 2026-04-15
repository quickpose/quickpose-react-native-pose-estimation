# Changelog

All notable changes to `@quickpose/react-native` will be documented in this file.

## [0.3.2] - 2026-04-15

### Added
- `captureFrame()` and `shareFrame(title?)` imperative methods on `QuickPoseView` via ref. `captureFrame()` returns a platform-local URI (`file://` iOS, `content://` Android) to a PNG of the current camera + overlay composite. `shareFrame()` opens the native share sheet in one call. The `example/` app now includes a "Share Screenshot" button.
- `QuickPoseViewRef` type exported for `useRef<QuickPoseViewRef>(null)`.

### Fixed
- Android camera preview is composited with the overlay on a single `SurfaceView`, so `react-native-view-shot` can't capture it. The new native path uses `PixelCopy` + a plugin-scoped `FileProvider`, so apps on Expo / bare RN can share screenshots without a third-party dep.

## [0.3.1] - 2026-04-15

### Added
- `QuickPoseThresholdCounter` and `FixedSizeRingBuffer` — JS utilities ported 1:1 from the iOS / Android SDKs so sample code reads the same across platforms.
- New `example-counter/` sample app demonstrating pose-gated rep counting: counting is paused while the SDK emits pose-check feedback (user not yet in position), so false reps during setup are avoided. Includes a live horizontal progress bar of the fitness measure.

## [0.3.0] - 2026-04-15

### Added
- `inside` feature (camera-edge limb containment detection) and `overlayHasCameraAsBackground` feature
- `head` and `wholeBodyAndHead` landmark groups (matches iOS/Android SDK)
- `hidden` and `edgeInsets` style keys
- Exported helper types: `ParsedFeature`, `Side`, `LandmarksGroup`, `ROMJoint`, `FitnessExercise`, `QuickPoseEdgeInsets`
- Exported `parseFeatureString` for consumers who want to pre-parse features

### Changed
- Feature parsing moved from native code to JS — native modules now receive structured `ParsedFeature` objects instead of strings + separate `stylesJson`. Simplifies adding new feature types.
- Android: bumped `ai.quickpose:quickpose-core` to `0.19`
- **Breaking:** `QuickPoseConditionalColor.min` / `max` are now optional (`?: number`) instead of `number | null`. Consumers passing `null` should switch to omitting the field or passing `undefined`.

### Removed
- `QuickPoseBasicView` (iOS) — folded into the main `QuickPoseView`
- `stylesJson` prop — styles are now embedded in the feature object

## [0.2.6] - 2026-03-09

### Added
- `featureStyles` prop for per-feature styling with color, line width, font size, arc size, corner radius, and conditional colors
- New exported types: `QuickPoseStyle`, `QuickPoseConditionalColor`

### Removed
- Removed `example-picker` app

## [0.2.5] - 2026-03-09

### Fixed
- Version bump for npm publish

## [0.2.4] - 2026-03-09

### Fixed
- Podspec: read repository URL from object instead of string

## [0.2.3] - 2026-03-09

### Fixed
- Publish workflow: upgrade npm for OIDC trusted publishing support

## [0.2.2] - 2026-03-09

### Fixed
- Publish workflow: remove registry-url to enable OIDC trusted publishing

## [0.2.1] - 2026-03-09

### Added
- Full React Native plugin with iOS and Android native modules
- `QuickPoseView` component with `sdkKey`, `features`, `useFrontCamera`, and `onUpdate` props
- Feature string parsing for overlays, range of motion, fitness, and input features
- Example app with feature picker UI
- GitHub Actions publish workflow with OIDC provenance
- TypeScript types for `QuickPoseViewProps`, `QuickPoseUpdateEvent`, `QuickPoseResult`

## [0.1.0] - 2023-10-16

### Added
- Initial React Native demo app with QuickPose pose estimation running on iOS
- Android native view manager support (2023-11-05)
