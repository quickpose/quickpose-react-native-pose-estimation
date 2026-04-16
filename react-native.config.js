module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {
        // IMPORTANT: keep `sourceDir` relative. Expo's autolinking does
        // `path.join(packageRoot, sourceDir)` — an absolute path here joins
        // wrong and makes the resolver silently drop Android autolinking.
        sourceDir: 'android',
        packageImportPath: 'import ai.quickpose.reactnative.QuickPosePackage;',
        packageInstance: 'new QuickPosePackage()',
      },
    },
  },
};
