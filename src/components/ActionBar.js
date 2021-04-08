import React, {PureComponent} from 'react'
import {Box, Text} from 'react-native-design-utility';
import {Platform} from 'react-native';
import AwesomeAlert from 'react-native-awesome-alerts';
import {inject} from "mobx-react";

import strings from '../constants/strings';
import theme from '../constants/theme';
import PopupMenu from './PopupMenu';
import {NavigationService} from "../api/NavigationService";

@inject("currentUser")
class ActionBar extends PureComponent {
    state = {
        showAlert: false,
        alertTitle: 'Logging out',
        alertMessage: 'Are you sure you want to Logout?'
    }

    onPopupEvent = (eventName, index) => {
        if (eventName !== 'itemSelected') return

        switch (index) {
            /*case 0:
                alert('subscription plans')
                break*/
            case 0:
                this.onLogout()
                break
            default:
                alert(strings.went_wrong)
                break
        }
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

    render() {
        return (
            <Box h={Platform.OS === 'ios' ? theme.space['3xl'] : theme.space['2xl']} center bg={theme.color.greenLight}
                 dir='row' style={{elevation: 10}} shadow={theme.shadows[0]}>
                <Box ml={'sm'} f={1} dir={'row'} style={{justifyContent: 'flex-start'}} />
                <Box style={{justifyContent: 'space-between'}}>
                    <Text bold size={'md'} color={'white'}>{strings.app_name}</Text>
                </Box>
                <Box mr={'sm'} f={1} dir={'row'} style={{justifyContent: 'flex-end'}}>
                    <PopupMenu actions={[
                        // 'Subscription Plans',
                        'Logout'
                    ]} onPress={this.onPopupEvent}/>
                </Box>
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

            </Box>
        );
    }
}

export default ActionBar