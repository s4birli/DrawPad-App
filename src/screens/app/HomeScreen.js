import React, {Component} from 'react';
import {Box, Text, UtilityThemeProvider} from 'react-native-design-utility';
import Animated from 'react-native-reanimated';
import {Dimensions, StyleSheet, TouchableOpacity} from 'react-native';
import {inject} from "mobx-react";
import AwesomeAlert from "react-native-awesome-alerts";
import * as Permissions from 'expo-permissions';
import {NavigationEvents} from "react-navigation";

import theme from '../../constants/theme';
import {NavigationService} from "../../api/NavigationService";
import Loader from "../../components/Loader";

const {width, height} = Dimensions.get('window');
const AnimatedBox = Animated.createAnimatedComponent(Box);

@inject("currentUser")
class HomeScreen extends Component {

    CURRENT_USER = this.props.currentUser

    state = {
        showAlert: false,
        alertTitle: '',
        alertMessage: '',
        showCancelButton: false,
        showSuccessButton: false,
        count: 0,
        loading: false,
    }

    componentDidMount() {
        this.askPermissions().then()
    }

    update_user_info = async () => {
        this.setState({loading: true})
        await this.CURRENT_USER.getUserInfo()
        this.set_count()
        this.setState({loading: false})
    }

    set_count = () => {
        this.setState({count: this.CURRENT_USER.info.procedures_count})
    }

    async askPermissions() {
        if (Platform.OS !== 'web') {
            const permission = await Permissions.askAsync(
                Permissions.CAMERA,
                Permissions.CAMERA_ROLL,
                Permissions.NOTIFICATIONS
            );

            if (permission.status !== 'granted') {
                alert('Sorry, we need camera roll permissions to make this work!');
                this.askPermissions().then()
            }
        }
    }

    /*checkVerification() {
            const {currentUser} = this.props;
            console.log('currentUser.info.email_verified_at: ', currentUser.info.email_verified_at)

            if (currentUser.info.email_verified_at == null) {
                Alert.alert('Email not verified', 'You need to verify your email address to get started. Check your email.')
            } else {
                this.setState({buttonDisables: false})
            }
        }*/

    show_alert = (
        show = true,
        show_error = true,
        show_success = false,
        title,
        message
    ) => {
        this.setState({
            showAlert: show,
            showCancelButton: show_error,
            showSuccessButton: show_success,
            alertTitle: title,
            alertMessage: message
        });
    };

    render() {
        return (
            <UtilityThemeProvider theme={theme}>
                <Box f={1} center>
                    <Loader loading={this.state.loading}/>
                    <NavigationEvents onDidFocus={() => this.update_user_info().then()}/>
                    <Text pt={'sm'} size={'md'} color={'black'}>
                        Number of Procedures left
                    </Text>
                    <Text bold color={this.state.count < 3 ? 'red' : 'green'}
                          size={'2xl'}>{this.state.count}</Text>
                    <Box w={width} h={height} justifyContent='center' f={0.8}>
                        {/*{
                        this.state.buttonDisables &&
                        <Box m={'sm'} center>
                            <Text center bold color={'red'}>
                                You need to verify your email address to get started. Check your email.
                            </Text>
                        </Box>
                    }*/}
                        {/* new procedure button */}
                        <TouchableOpacity onPress={() => {
                            this.state.count === 0 ?
                                this.show_alert(
                                    true,
                                    true,
                                    false,
                                    "Procedures Error",
                                    'You have used all of your free procedures. In order to continue using this service, please consider buying our paid plans or contact your administrator.'
                                )
                                :
                                NavigationService.navigate('NewProcedure', {from: 'new'})
                        }}>
                            <AnimatedBox
                                h={theme.space['2xl']}
                                center
                                align='center'
                                bg={theme.color.greenLight}
                                style={{...styles.buttons}}
                                radius={theme.space.sm}
                            >
                                <Text size={theme.text.size.sm} color='white' weight={theme.text.weight.bold}>
                                    NEW PROCEDURE
                                </Text>
                            </AnimatedBox>
                        </TouchableOpacity>

                        {/* saved button */}
                        <TouchableOpacity onPress={() => NavigationService.navigate('SavedProcedures')}>
                            <AnimatedBox
                                h={theme.space['2xl']}
                                center
                                align='center'
                                bg={theme.color.white}
                                style={{...styles.buttons}}
                                radius={theme.space.sm}
                            >
                                <Text size={theme.text.size.sm} color='grey' weight={theme.text.weight.bold}>
                                    SAVED PROCEDURES
                                </Text>
                            </AnimatedBox>
                        </TouchableOpacity>

                        {/* pdf button */}
                        <TouchableOpacity onPress={() => NavigationService.navigate('PDFProcedures')}>
                            <AnimatedBox
                                h={theme.space['2xl']}
                                center
                                align='center'
                                bg={theme.color.white}
                                style={{...styles.buttons}}
                                radius={theme.space.sm}
                            >
                                <Text size={theme.text.size.sm} color='grey' weight={theme.text.weight.bold}>
                                    PDF PROCEDURES
                                </Text>
                            </AnimatedBox>
                        </TouchableOpacity>
                    </Box>

                    <AwesomeAlert
                        show={this.state.showAlert}
                        showProgress={false}
                        title={this.state.alertTitle}
                        message={this.state.alertMessage}
                        closeOnTouchOutside={false}
                        closeOnHardwareBackPress={false}
                        showCancelButton={this.state.showCancelButton}
                        showConfirmButton={this.state.showSuccessButton}
                        confirmText="Ok"
                        cancelText="Ok"
                        confirmButtonColor={theme.color.greenLight}
                        onConfirmPressed={() => this.setState({showAlert: false})}
                        onCancelPressed={() => this.setState({showAlert: false})}
                    />
                </Box>
            </UtilityThemeProvider>
        );
    }
}

export default HomeScreen;

const styles = StyleSheet.create({
    buttons: {
        marginHorizontal: theme.space.sm,
        marginVertical: theme.space['2xs'],
        elevation: 3,
        shadowOffset: {width: 2, height: 2},
        shadowColor: theme.color.black,
        shadowOpacity: theme.opacity.low,
    },
})