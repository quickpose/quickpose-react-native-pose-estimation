import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  requireNativeComponent,
  UIManager,
  findNodeHandle
} from "react-native";

const COMPONENT_NAME = "QuickPoseView";
const RNQuickPoseView = requireNativeComponent(COMPONENT_NAME);

export default class QuickPoseView extends Component {
  static propTypes = {
    onUpdate: PropTypes.func
  };

  _onUpdate = event => {
    // call it only if a handler was passed as props
    if (this.props.onUpdate) {
      this.props.onUpdate(event.nativeEvent);
    }
  };

  render() {
    const { style } = this.props;
    return (
      <RNQuickPoseView
        style={style}
        onUpdate={this._onUpdate}
        ref={ref => (this.ref = ref)}
      />
    );
  }

  update = (...args) => {
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this.ref),
      UIManager[COMPONENT_NAME].Commands.updateFromManager,
      [...args]
    );
  };
}