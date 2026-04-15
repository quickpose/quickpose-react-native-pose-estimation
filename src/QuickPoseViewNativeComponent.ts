import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ViewProps } from 'react-native';
import type { Double, DirectEventHandler } from 'react-native/Libraries/Types/CodegenTypes';

type NativeEdgeInsets = Readonly<{
  top?: Double;
  left?: Double;
  bottom?: Double;
  right?: Double;
}>;

type NativeConditionalColor = Readonly<{
  min?: Double;
  max?: Double;
  color: string;
}>;

type NativeStyle = Readonly<{
  color?: string;
  relativeFontSize?: Double;
  relativeArcSize?: Double;
  relativeLineWidth?: Double;
  cornerRadius?: Double;
  hidden?: boolean;
  conditionalColors?: ReadonlyArray<NativeConditionalColor>;
  edgeInsets?: NativeEdgeInsets;
}>;

type NativeFeature = Readonly<{
  type: string;
  featureKey: string;
  group?: string;
  side?: string;
  joint?: string;
  exercise?: string;
  clockwise?: boolean;
  darkenCamera?: Double;
  edgeInsets?: NativeEdgeInsets;
  style?: NativeStyle;
}>;

interface NativeProps extends ViewProps {
  sdkKey: string;
  features: ReadonlyArray<NativeFeature>;
  useFrontCamera?: boolean;
  onUpdate?: DirectEventHandler<{resultsJson: string; feedback: string}>;
}

export default codegenNativeComponent<NativeProps>('QuickPoseView');
