# Changelog

All notable changes to `@quickpose/react-native` will be documented in this file.

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
