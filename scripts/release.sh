#!/usr/bin/env bash
# Release @quickpose/react-native.
#
# Bumps the three version references this plugin pins — the npm version, the iOS
# SDK pod tag, and the Android core Maven version — then type-checks. Each has a
# single canonical location so a bump can never partially drift:
#   - npm version          → package.json
#   - iOS pods (v<semver>)  → example/ios/Podfile   (quickpose_ios_tag)
#   - Android core          → android/build.gradle  (ai.quickpose:quickpose-core:<v>)
#
# Usage:
#   scripts/release.sh <npm-version> <ios-pod-tag> <android-core-version>
#   e.g. scripts/release.sh 0.6.1 v1.4.0 0.23
#
# Prereqs: the iOS tag must exist on the public quickpose-ios-sdk repo, and the
# Android core version must be live on Maven Central, or consumers can't resolve them.
set -euo pipefail

NPM_VER="${1:?usage: release.sh <npm-version> <ios-pod-tag> <android-core-version>}"
IOS_TAG="${2:?usage: release.sh <npm-version> <ios-pod-tag> <android-core-version>}"
CORE_VER="${3:?usage: release.sh <npm-version> <ios-pod-tag> <android-core-version>}"
cd "$(dirname "$0")/.."

echo "→ npm version ${NPM_VER}"
npm version "$NPM_VER" --no-git-tag-version >/dev/null

echo "→ iOS pods ${IOS_TAG}  (example/ios/Podfile)"
perl -0pi -e "s/quickpose_ios_tag = '[^']*'/quickpose_ios_tag = '${IOS_TAG}'/" example/ios/Podfile

echo "→ Android core ${CORE_VER}  (android/build.gradle)"
perl -0pi -e "s/ai\\.quickpose:quickpose-core:[0-9][0-9.]*/ai.quickpose:quickpose-core:${CORE_VER}/" android/build.gradle

echo "→ typecheck"
npm run typescript

cat <<EOF

Bumped: npm=${NPM_VER}  iOS pods=${IOS_TAG}  Android core=${CORE_VER}
Next — build-test example on both platforms, then release:
  (cd example/android && ./gradlew :app:assembleDebug)
  (cd example/ios && pod install)   # resolves ${IOS_TAG}
  git add -A && git commit -m "${NPM_VER}"
  npm publish
  git tag "v${NPM_VER}" && git push origin main --tags
EOF
