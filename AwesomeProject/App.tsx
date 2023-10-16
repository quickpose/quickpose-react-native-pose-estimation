/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';


import QuickPoseBasicView from './QuickPoseBasicView'

export default class App extends Component {

  state = {
    angle: 0.0
  };

  update = e => {
    this.setState({
      angle: e.angle
    })
  }

  render() {

    return (
      <View style={{ flex: 1}}>
        <QuickPoseBasicView
          style={{ height: '100%', width: '100%', zIndex: 0}}
          onUpdate={this.update}
        />
        
        <Text
        style={{ color:'white', fontSize: 16, fontWeight:"bold", height: '100%', width: '100%' , marginTop: -60, textAlign: 'center', zIndex: 1 }}>
          React Native Value: {parseFloat(this.state.angle.toFixed(0))}°
        </Text>
     
      </View>
    );
  }
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});
