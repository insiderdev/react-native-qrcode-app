import React from 'react';

import {
  TouchableOpacity,
  Modal,
  View,
  TouchableHighlight,
  Image,
  Dimensions,
  Text,
  Linking,
  AsyncStorage,
  StatusBar
} from 'react-native';

import Camera from 'react-native-camera';
import Clipboard from 'react-native-clipboard';
import Toast from 'react-native-simple-toast';
import Share from 'react-native-share';
import validUrl from 'valid-url';
import NavigationBar from 'react-native-navbar';

import {
  Card,
  Caption,
  Subtitle,
  Icon,
  Button,
  Text as SHText,
  Row,ListView
} from '@shoutem/ui';


class BarcodeScannerApp extends React.Component {
  constructor(props) {
    super(props);

    console.disableYellowBox = true;

    this.state = {
      torchMode: 1,
      cameraType: 'back',
      flashlightEnabled: false,
      resultModalVisible: false,
      parsingResult: null,
      historyModalVisible: true,
      history: ['Oneee','Twoooo','Threee']
    };

    this.loadHistory();
  }

  async loadHistory() {
    try {
      const value = await AsyncStorage.getItem('history');
      if (value !== null){
        // this.state.history = JSON.parse(value);
      }
    } catch (error) {
      alert(error);
    }
  }

  closeModal() {
    this.setState({
      resultModalVisible: !this.state.resultModalVisible,
      parsingResult: null
    })
  }

  toggleHistoryModal() {
    this.setState({
      historyModalVisible: !this.state.historyModalVisible
    });
  }

  barcodeReceived(e) {
    console.log('Barcode: ' + e.data);
    console.log('Type: ' + e.type);
  }

  async openUrl(url) {
    Linking.canOpenURL(url).then(supported => {
      if (!supported) {
        alert('Can\'t handle url: ' + url);
      } else {
        return Linking.openURL(url);
      }
    }).catch(err => alert('An error occurred ' + err));
  }

  _renderNavigator() {
    const rightButtonConfig = (
      <Button onPress={() => {this.toggleHistoryModal()}} style={{marginTop: 5, backgroundColor: '#F8F8F8', borderWidth: 0}}>
        <Icon name="close" />
      </Button>
    );

    const titleConfig = {
      title: 'Your history'
    };

    return (
      <View style={{marginBottom: 0, backgroundColor: '#F8F8F8'}}>
        <NavigationBar
          style={{backgroundColor: '#F8F8F8'}}
          title={titleConfig}
          leftButton={rightButtonConfig} />
      </View>
    );
  }

  renderRow(data) {
    return (
      <Row styleName="small" style={{flex: 1, alignSelf: 'stretch', backgroundColor: 'white', marginTop: 3, marginBottom: 3}}>
        <Icon name="web" />
        <Text style={{flex: 1}}>{data}</Text>
        <Button styleName="right-icon"><Icon name="add-to-cart" /></Button>
        <Button styleName="right-icon"><Icon name="add-to-cart" /></Button>
      </Row>
    )
  }

  render() {

    return (
      <View style={{flex: 1}}>
        <StatusBar
          backgroundColor="transparent"
        />

        <Modal
          animationType={"slide"}
          transparent={true}
          visible={this.state.resultModalVisible}
        >
          <View style={styles.modalContainer}>
            <Card style={styles.modalCardContainer}>
              <View styleName="content" style={{alignSelf: 'stretch'}}>
                <View style={{alignItems: 'flex-end'}}>
                  <TouchableOpacity
                    onPress={() => {
                      this.closeModal();
                    }}
                  >
                    <Icon name="close" />
                  </TouchableOpacity>
                </View>

                <Subtitle>{this.state.parsingResult}</Subtitle>

                <View style={styles.modalCardContent} />
                <View style={{flexDirection: 'row'}}>
                  { validUrl.isUri(this.state.parsingResult) ?
                    <TouchableOpacity
                      onPress={() => {
                        this.openUrl(this.state.parsingResult);
                      }}
                      style={styles.actionButton}
                    >
                        <View>
                          <Icon name="ic_exit_to_app"/>
                          <Caption>Open</Caption>
                        </View>
                    </TouchableOpacity> : null
                  }
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      Clipboard.set(this.state.parsingResult);
                      Toast.show('Copied to clipboard!');
                      this.closeModal();
                    }}
                  >
                    <Icon name="activity" />
                    <Caption>Copy</Caption>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Share.open(validUrl.isUri(this.state.parsingResult) ? {
                        url: this.state.parsingResult
                      } : {
                        message: this.state.parsingResult
                      });
                      this.closeModal();
                    }}
                    style={styles.actionButton}
                  >
                    <Icon name="share-android" />
                    <Caption>Share</Caption>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          </View>
        </Modal>

        <Modal
          animationType={"slide"}
          transparent={true}
          visible={this.state.historyModalVisible}
        >
          <View style={{flex: 1, backgroundColor: '#F8F8F8', justifyContent: 'flex-start', top: 0}}>
            {this._renderNavigator()}

            <ListView
              style={{flex: 1, alignSelf: 'stretch', background: 'black'}}
              data={this.state.history}
              renderRow={this.renderRow}
            />

          </View>
        </Modal>

        <View
          onBarCodeRead={this.barcodeReceived}
          style={{ flex: 1, backgroundColor: '#e3e3e3' }}
          torchMode={1}
          flashMode={Camera.constants.FlashMode.on}
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
            <TouchableOpacity onPress={() => this.toggleHistoryModal()} style={styles.button}>
              <Image
                style={styles.buttonImage}
                source={require('./img/clock.png')}
              />
            </TouchableOpacity>
          </View>
        </View>
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
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    padding: 5,
    backgroundColor: '#e3e3e3',
    borderRadius: 10
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCardContainer: {
    width: Dimensions.get('window').width / 5 * 4,
    padding: 5
  },
  modalCardContent: {
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
    alignSelf: 'stretch'
  }
};

export default BarcodeScannerApp;