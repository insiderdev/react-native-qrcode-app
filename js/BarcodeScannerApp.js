'use strict';

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
import QRCode from 'react-native-qrcode';
import LocalizedStrings from 'react-native-localization';

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
  Platform,
  ListView,
  AppState
} from 'react-native';

import {
  Card,
  Caption,
  Subtitle,
  Title,
  Icon,
  Button,
  Text as SHText,
  TextInput
} from '@shoutem/ui';

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

const primaryColor = '#fc6821';

const strings = new LocalizedStrings({
  en: {
    history: 'History',
    cantHandleUrl: 'Can\'t handle url: ',
    errorOccured: 'An error occurred ',
    copied: 'Copied to clipboard!',
    textToGenerate: 'Text to generate',
    noHistory: 'No history yet :(',
    open: 'Open',
    copy: 'Copy',
    share: 'Share'
  },
  ru: {
    history: 'История',
    cantHandleUrl: 'Не могу открыть ссылку: ',
    errorOccured: 'Произошла ошибка ',
    copied: 'Скопированно в буфер обмена!',
    textToGenerate: 'Текст для генерации',
    noHistory: 'Пока пусто :(',
    open: 'Открыть',
    copy: 'Скопировать',
    share: 'Поделиться'
  }
});

class BarcodeScannerApp extends React.Component {
  constructor(props) {
    super(props);

    console.disableYellowBox = true;

    this.state = {
      cameraType: 'back',
      flashlightEnabled: false,
      resultModalVisible: false,
      parsingResult: null,
      historyModalVisible: false,
      generateModalVisible: false,
      history: ds.cloneWithRows([]),
      textToGenerate: '',
      torchMode: Camera.constants.TorchMode.off,
      isActiveState: true
    };

    BackAndroid.addEventListener('hardwareBackPress', this.pop.bind(this));

    this.loadHistory();
  }

  /**
   * Log event to Firebase analytics
   * @param eventName name of the event
   */
  logEvent(eventName) {
    if (Platform.OS === 'android') {
      FirebaseAnalytics.logEvent(eventName, {});
    }
  }

  /**
   * Called on BackButton press. Hides modal is any of them currently visible
   * or exits the app.
   */
  pop() {
    if (this.state.historyModalVisible) {
      this.toggleHistoryModal();
    } else if (this.state.resultModalVisible) {
      this.closeResultsModal();
    } else {
      BackAndroid.exitApp()
    }
    return true;
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

  closeResultsModal() {
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

  toggleGenerateModal() {
    if (!this.state.generateModalVisible) {
      this.logEvent('open_generate');
    } else {
      if (this.state.textToGenerate) {
        this.setState({
          textToGenerate: ''
        });
      }
    }

    this.setState({
      generateModalVisible: !this.state.generateModalVisible
    });
  }

  toggleFlash() {
    this.setState({
      flashlightEnabled: !this.state.flashlightEnabled,
      torchMode: this.state.torchMode == Camera.constants.TorchMode.off ?
                    Camera.constants.TorchMode.on : Camera.constants.TorchMode.off
    });
  }

  barcodeReceived(e) {
    if (this.state.parsingResult ||
        this.state.generateModalVisible ||
        this.state.historyModalVisible) return;

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
        alert(strings.cantHandleUrl + url);
      } else {
        return Linking.openURL(url);
      }
    }).catch(err => alert(strings.errorOccurred + err));
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
          title={{title: strings.history}}
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
      <View style={{flex: 1, padding: 20, flexDirection: 'row', ...styles.historyRowItemStyle}}>
        <FAIcon
          name={iconName}
          size={20}
          style={{marginRight: 15}}
        />

        <Text style={{flex: 1}}>{data.data}</Text>

        <Button
          onPress={() => {
            Clipboard.setString(data.data);
            Toast.show(strings.copied);
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
          <FAIcon
            name={validUrl.isUri(data.data) ? 'external-link' : 'share'}
            size={25}
            color="#000"
          />
        </Button>
      </View>
    );
  }

  _renderResultModal() {
    return (
      <Modal
        animationType={"slide"}
        transparent={true}
        visible={this.state.resultModalVisible}
        onRequestClose={() => {
          this.closeResultsModal();
        }}
      >
        <View style={styles.modalContainer}>
          <Card style={styles.modalCardContainer}>
            <View styleName="content" style={{alignSelf: 'stretch'}}>
              <View style={{alignItems: 'flex-end'}}>
                <TouchableOpacity
                  onPress={() => {
                      this.closeResultsModal();
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
                      <Caption>{strings.open}</Caption>
                    </View>
                  </TouchableOpacity> : null
                }

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                      Clipboard.setString(this.state.parsingResult.toString());
                      Toast.show(strings.copied);
                      this.closeResultsModal();
                      this.logEvent('copy_to_clipboard');
                    }}
                >
                  <Icon name="activity" />
                  <Caption>{strings.copy}</Caption>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                      Share.open(validUrl.isUri(this.state.parsingResult) ? {
                        url: this.state.parsingResult
                      } : {
                        message: this.state.parsingResult
                      });
                      this.closeResultsModal();
                      this.logEvent('share');
                    }}
                  style={styles.actionButton}
                >
                  <Icon name="share-android" />
                  <Caption>{strings.share}</Caption>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </View>
      </Modal>
    )
  }

  _renderHistoryModal() {
    const toRender = ds.cloneWithRows(this.state.history);

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

          {this.state.history.length ?
            (
              <ListView
                dataSource={toRender}
                renderRow={this.renderRow.bind(this)}
                initialListSize={1}
              />
            ) :
            (
              <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                <Title>{strings.noHistory}</Title>
              </View>
            )
          }
        </View>
      </Modal>
    )
  }

  _renderGenerateModal() {
    return (
      <Modal
        animationType={"slide"}
        transparent={true}
        visible={this.state.generateModalVisible}
        onRequestClose={() => {
          this.toggleGenerateModal();
        }}
      >
        <View style={styles.modalContainer}>
          <Card style={styles.modalCardContainer}>
            <View styleName="content" style={{alignSelf: 'stretch'}}>
              <View style={{alignItems: 'flex-end'}}>
                <TouchableOpacity
                  onPress={() => {
                      this.toggleGenerateModal();
                    }}
                >
                  <Icon name="close" />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder={strings.textToGenerate}
                onChangeText={newText => {
                  this.setState({
                    textToGenerate: newText
                  })
                }}
              />

              <View style={{padding: 10}}>
                <QRCode
                  value={this.state.textToGenerate}
                  size={Dimensions.get('window').width - 100}
                  bgColor={primaryColor}
                  fgColor="white"
                  />
              </View>
            </View>
          </Card>
        </View>
      </Modal>
    )
  }

  render() {
    const TopComponent = this.state.isActiveState ? Camera : View;

    return (
      <View style={{flex: 1}}>
        <StatusBar
          backgroundColor={primaryColor}
        />

        {this._renderResultModal()}
        {this._renderHistoryModal()}
        {this._renderGenerateModal()}

        <TopComponent
          onBarCodeRead={this.barcodeReceived.bind(this)}
          style={{ flex: 1, backgroundColor: primaryColor }}
          torchMode={this.state.torchMode}
        >
          <ViewFinder/>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={() => {
                this.toggleGenerateModal();
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
                this.toggleFlash();
                if (!this.state.flashlightEnabled) {
                  this.logEvent('toggle_flash');
                }
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
        </TopComponent>
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
    backgroundColor: primaryColor,
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
    paddingTop: 5,
    marginBottom: 5,
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

export default codePush(BarcodeScannerApp);