import React from 'react';

import {
  View,
  TouchableOpacity,
  Image
} from 'react-native';

import Camera from 'react-native-camera';

class BarcodeScannerApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      torchMode: 1,
      cameraType: 'back',
      flashlightEnabled: false
    };
  }

  barcodeReceived(e) {
    console.log('Barcode: ' + e.data);
    console.log('Type: ' + e.type);
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <Camera
          onBarCodeRead={this.barcodeReceived}
          style={{ flex: 1 }}
          torchMode={1}
        >
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button}>
              <Image
                style={styles.buttonImage}
                source={require('./img/plus.png')}
              />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, this.state.flashlightEnabled && styles.buttonActive]}>
              <Image
                style={styles.buttonImage}
                source={require('./img/flash_light.png')}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <Image
                style={styles.buttonImage}
                source={require('./img/clock.png')}
              />
            </TouchableOpacity>
          </View>
        </Camera>
      </View>
    );
  }
}

const styles = {
  buttonsContainer: {
    position: 'absolute',
    bottom: 0,
    height: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row',
    opacity: 0.3
  },
  button: {
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonImage: {
    width: 40,
    height: 40,
    tintColor: 'white'
  },
  buttonActive: {
    backgroundColor: 'blue',
    opacity: 1
  }
};

export default BarcodeScannerApp;