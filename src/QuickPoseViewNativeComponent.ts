import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ViewProps } from 'react-native';
import type { DirectEventHandler } from 'react-native/Libraries/Types/CodegenTypes';

interface NativeProps extends ViewProps {
  sdkKey: string;
  features: ReadonlyArray<string>;
  useFrontCamera?: boolean;
  onUpdate?: DirectEventHandler<{resultsJson: string; feedback: string}>;
}

export default codegenNativeComponent<NativeProps>('QuickPoseView');
