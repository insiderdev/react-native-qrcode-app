import React from 'react';
import Camera from 'react-native-camera';
import Toast from 'react-native-simple-toast';
import Share from 'react-native-share';
import validUrl from 'valid-url';
import NavigationBar from 'react-native-navbar';
import ViewFinder from './ViewFinder';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import FirebaseAnalytics from './FirebaseAnalytics';
import codePush from "react-native-code-push";

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
  StatusBar,
  Clipboard,
  UIManager,
  LayoutAnimation,
  BackAndroid,
  Platform
} from 'react-native';

import {
  Card,
  Caption,
  Subtitle,
  Icon,
  Button,
  Text as SHText,
  Row,ListView
} from '@shoutem/ui';


@codePush
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
      historyModalVisible: false,
      history: []
    };

    BackAndroid.addEventListener('hardwareBackPress', () => this.pop(this.state));

    this.loadHistory();
  }

  logEvent(eventName) {
    if (Platform.OS === 'android') {
      FirebaseAnalytics.logEvent(eventName, {});
    }
  }

  pop(state) {
    if (state.historyModalVisible) {
      this.toggleHistoryModal();
    } else if (state.resultModalVisible) {
      this.closeModal();
    } else {
      BackAndroid.exitApp()
    }
    return true;
  }

  componentWillMount() {

  }

  async loadHistory() {
    try {
      const value = await AsyncStorage.getItem('history');
      if (value !== null){
        this.state.history = JSON.parse(value);
      }
    } catch (error) {
      alert(error);
    }
  }

  async saveToHistory() {
    try {
      await AsyncStorage.setItem('history', JSON.stringify(this.state.history));
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
    if (!this.state.historyModalVisible) {
      this.logEvent('open_history');
    }

    this.setState({
      historyModalVisible: !this.state.historyModalVisible
    });
  }

  barcodeReceived(e) {
    if (this.state.parsingResult) return;

    this.setState({
      parsingResult: e.data,
      resultModalVisible: true,
      history: [...this.state.history, {
        type: e.type,
        data: e.data
      }]
    });

    this.saveToHistory();
  }

  async openUrl(url) {
    this.logEvent('open_url');

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
      <Button
        onPress={() => {this.toggleHistoryModal()}}
        style={styles.navigationBarButton}
      >
        <Icon name="close" />
      </Button>
    );

    return (
      <View style={styles.navigationBarContainer}>
        <NavigationBar
          style={styles.navigationBar}
          title={{title: 'History'}}
          leftButton={rightButtonConfig} />
      </View>
    );
  }

  renderRow(data) {
    let iconName = 'dot-circle-o';
    if (data.type === 'CODE_128') {
      iconName = 'barcode';
    } else if (data.type === 'QR_CODE') {
      if (validUrl.isUri(data.data)) {
        iconName = 'globe';
      } else {
        iconName = 'qrcode';
      }
    }

    return (
      <Row styleName="small" style={styles.historyRowItemStyle}>
        <FAIcon name={iconName}  size={20} style={{marginRight: 15}}/>

        <Text style={{flex: 1}}>{data.data}</Text>

        <Button
          onPress={() => {
            Clipboard.setString(data.data);
            Toast.show('Copied to clipboard');
            this.logEvent('copy_to_clipboard');
          }}
          styleName="right-icon"
        >
          <FAIcon name="clone" size={25} color="#000" />
        </Button>

        <Button
          onPress={() => {
            if (validUrl.isUri(data.data)) {
              this.openUrl(data.data);
            } else {
              Share.open({
                message: data.data
              });
              this.logEvent('share');
            }
          }}
          styleName="right-icon"
          style={{marginLeft: 20}}
        >
          <FAIcon name={validUrl.isUri(data.data) ? 'external-link' : 'share'} size={25} color="#000" />
        </Button>
      </Row>
    )
  }

  _renderResultModal() {
    return (
      <Modal
        animationType={"slide"}
        transparent={true}
        visible={this.state.resultModalVisible}
        onRequestClose={() => {
          this.closeModal();
        }}
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
                      Clipboard.setString(this.state.parsingResult.toString());
                      Toast.show('Copied to clipboard!');
                      this.closeModal();
                      this.logEvent('copy_to_clipboard');
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
                      this.logEvent('share');
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
    )
  }

  _renderHistoryModal() {
    return (
      <Modal
        animationType={"slide"}
        transparent={true}
        visible={this.state.historyModalVisible}
        onRequestClose={() => {
          this.toggleHistoryModal();
        }}
      >
        <View style={styles.historyModalContainer}>
          {this._renderNavigator()}

          <ListView
            data={this.state.history}
            renderRow={this.renderRow.bind(this)}
          />
        </View>
      </Modal>
    )
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <StatusBar
          backgroundColor="#e3e3e3"
        />
        {this._renderResultModal()}
        {this._renderHistoryModal()}

        <Camera
          onBarCodeRead={this.barcodeReceived.bind(this)}
          style={{ flex: 1, backgroundColor: '#e3e3e3' }}
          torchMode={1}
          flashMode={Camera.constants.FlashMode.on}
        >
          <ViewFinder/>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={() => {
                this.logEvent('click_plus');
              }}
              style={styles.button}
            >
              <Image
                style={styles.buttonImage}
                source={require('./img/plus.png')}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                this.logEvent('toggle_flash');
              }}
              style={[styles.button, this.state.flashlightEnabled && styles.buttonActive]}
            >
              <Image
                style={styles.buttonImage}
                source={require('./img/flash_light.png')}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => this.toggleHistoryModal()}
              style={styles.button}
            >
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
  },
  navigationBarContainer: {
    marginBottom: 0,
    backgroundColor: '#F8F8F8'
  },
  navigationBar: {
    backgroundColor: '#F8F8F8'
  },
  navigationBarButton: {
    marginTop: 5,
    backgroundColor: '#F8F8F8',
    borderWidth: 0
  },
  historyModalContainer: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    justifyContent: 'flex-start',
    top: 0
  },
  historyRowItemStyle: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: 'white',
    marginTop: 3,
    marginBottom: 3
  }
};

export default BarcodeScannerApp;