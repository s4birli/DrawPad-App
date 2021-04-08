import React, {Component} from 'react'
import PropTypes from 'prop-types';
import {ActionSheetIOS, findNodeHandle, Platform, TouchableOpacity, UIManager, View} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import theme from '../constants/theme';
import strings from "../constants/strings";
import {NavigationService} from "../api/NavigationService";
import {inject} from "mobx-react";
import AwesomeAlert from "react-native-awesome-alerts";

const ICON_SIZE = 24

@inject("currentUser")
export default class PopupMenu extends Component {
    static propTypes = {
        // array of strings, will be list items of Menu
        actions: PropTypes.arrayOf(PropTypes.string).isRequired,
        onPress: PropTypes.func.isRequired
    }

    constructor(props) {
        super(props)
        this.state = {
            icon: null,
            showAlert: false,
            alertTitle: 'Logging out',
            alertMessage: 'Are you sure you want to Logout?'
        }
    }

    onError() {
        alert('Popup error')
    }

    onLogout = () => {
        this.setState({showAlert: true})
    }

    confirmLogout = () => {
        // Toast.show('Logging session out', Toast.SHORT, Toast.BOTTOM)
        setTimeout(async () => {
            await this.props.currentUser.logout(Platform.OS === 'ios' ? strings.ios : strings.android).then();
        }, 1000)
        NavigationService.navigate('Auth')
    }

    onPress = () => {
        if (this.state.icon) {
            Platform.OS === 'android' ?
                UIManager.showPopupMenu(
                    findNodeHandle(this.state.icon),
                    this.props.actions,
                    this.onError,
                    this.props.onPress
                )
                :
                ActionSheetIOS.showActionSheetWithOptions(
                    {
                        options: ["Cancel", "Logout"],
                        destructiveButtonIndex: 1,
                        cancelButtonIndex: 0
                    },
                    buttonIndex => {
                        if (buttonIndex === 0) {
                            // cancel action
                        } else if (buttonIndex === 1) {
                            this.onLogout()
                        }
                    });
        }
    }

    render() {
        return (
            <View>
                <TouchableOpacity onPress={this.onPress}>
                    <Icon
                        name='more-vert'
                        size={ICON_SIZE}
                        color={theme.color.white}
                        ref={this.onRef}/>
                </TouchableOpacity>

                <AwesomeAlert
                    show={this.state.showAlert}
                    showProgress={false}
                    title={this.state.alertTitle}
                    message={this.state.alertMessage}
                    closeOnTouchOutside={false}
                    closeOnHardwareBackPress={false}
                    showCancelButton={true}
                    showConfirmButton={true}
                    cancelText='No, cancel'
                    confirmText='Yes, Log me out'
                    confirmButtonColor={theme.color.redDark}
                    onConfirmPressed={() => {
                        this.confirmLogout()
                    }}
                    onCancelPressed={() => {
                        this.setState({showAlert: false});
                    }}
                />

            </View>
        )
    }

    onRef = icon => {
        if (!this.state.icon) {
            this.setState({icon})
        }
    }
}
