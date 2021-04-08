import React, {Component} from "react";
import {Box} from "react-native-design-utility";
import {Animated, Dimensions, Keyboard, KeyboardAvoidingView, ScrollView, StyleSheet, Text,} from "react-native";
import AwesomeAlert from "react-native-awesome-alerts";
import {inject} from "mobx-react";
import {TouchableOpacity} from "react-native-gesture-handler";

import OnboardingLogo from "../../shared/OnboardingLogo";
import strings from "../../constants/strings";
import theme from "../../constants/theme";
import UserInput from "../../shared/UserInput";
import Loader from "../../components/Loader";
import {NavigationService} from "../../api/NavigationService";

const AnimatedBox = Animated.createAnimatedComponent(Box);
const {width, height} = Dimensions.get("window");

@inject("currentUser")
class RegisterScreen extends Component {
    state = {
        alertTitle: "",
        alertMessage: "",

        loading: false,
        showAlert: false,
        showConfirmButton: false,
        showCancelButton: false,

        opacity: new Animated.Value(0),
        position: new Animated.Value(0),

        userName: "",
        userEmail: "",
        userPassword: "",
        userConfirmPassword: "",
        /*userAddress: "",
        userPhone: "",*/
    };

    componentDidMount() {
        Animated.parallel([this.positionAnim(), this.opacityAnim()]).start();
    }

    opacityAnim = () => {
        Animated.timing(this.state.opacity, {
            toValue: 1,
            duration: 500,
            delay: 100,
            useNativeDriver: false,
        }).start();
    };

    positionAnim = () => {
        Animated.timing(this.state.position, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    show_alert = (
        show = true,
        show_cancel = true,
        show_confirm = false,
        title,
        message
    ) => {
        this.setState({
            showAlert: show,
            showCancelButton: show_cancel,
            showConfirmButton: show_confirm,
            alertTitle: title,
            alertMessage: message
        });
    };

    REGISTER = async () => {
        if (!this.state.userEmail) {
            this.show_alert(
                true,
                true,
                false,
                "Email Error",
                strings.required_email);
            return;
        }

        if (!this.state.userPassword) {
            this.show_alert(
                true,
                true,
                false,
                "Password Error",
                strings.required_password
            );
            return;
        }

        if (!this.state.userConfirmPassword) {
            this.show_alert(
                true,
                true,
                false,
                "Confirm Password Error",
                strings.required_confirm_password
            );
            return;
        }

        if (this.state.userPassword !== this.state.userConfirmPassword) {
            this.show_alert(
                true,
                true,
                false,
                "Passwords mismatch",
                strings.password_mismatch
            );
            return;
        }

        if (this.state.userPassword.length < 8) {
            this.show_alert(
                true,
                true,
                false,
                "Password too short",
                strings.short_password
            );
            return;
        }

        /*if (!this.state.userAddress) {
            this.show_alert(
                true,
                true,
                false,
                "Address Error",
                strings.required_address
            );
            return;
        }

        if (!this.state.userPhone) {
            this.show_alert(
                true,
                true,
                false,
                "Phone Error",
                strings.required_phone
            );
            return;
        }*/

        this.setState({loading: true});

        const result = await this.props.currentUser.register(
            this.state.userName,
            this.state.userEmail,
            this.state.userPassword,
            /* this.state.userAddress,
             this.state.userPhone,*/
            Platform.OS === 'ios' ? strings.ios : strings.android
        );
        console.log(result)
        if (result.status === 200) {
            await this.props.currentUser.saveAuthToken(result.data.token);
            // Toast.show(result.message, Toast.LONG, Toast.BOTTOM);
            NavigationService.navigate('App');
        } else {
            let res = JSON.parse(result)
            let errors = res.data
            let items = Object.keys(errors);
            let value = ''
            items.map(key => {
                value = '- ' + errors[key][0] + '\n' + value
            });
            console.log('errors: ', value);
            this.show_alert(
                true,
                true,
                false,
                '' + res.message,
                '' + value
            );
        }
        this.setState({loading: false});
    };

    render() {
        const opacity = this.state.opacity;
        const logoPosition = this.state.position.interpolate({
            inputRange: [0, 1],
            outputRange: [200, 0],
        });
        return (
            <KeyboardAvoidingView
                style={{
                    flex: 1,
                    justifyContent: "flex-end",
                }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                enabled
            >
                <Box f={1} bg="greyLightest" center>
                    <Loader loading={this.state.loading}/>
                    <AnimatedBox
                        f={1}
                        align={"center"}
                        center
                        style={{
                            transform: [{translateY: logoPosition}],
                            marginBottom: -90,
                            marginTop: -90,
                        }}
                    >
                        <OnboardingLogo/>
                    </AnimatedBox>
                    <AnimatedBox f={1} w={"100%"} style={{opacity: opacity}}>
                        <ScrollView keyboardShouldPersistTaps="handled">
                            <Box f={1} ph={"md"}>
                                {/*name field*/}
                                <UserInput
                                    placeholder={"Name"}
                                    keyboardType={"default"}
                                    setState={(data) => this.setState({userName: data})}
                                    reference={(input) => {
                                        this._nameInput = input;
                                    }}
                                    returnKey={"next"}
                                    onSubmit={() => this._emailInput && this._emailInput.focus()}
                                    blur={true}
                                    style={styles.input}
                                />
                                {/*email field*/}
                                <UserInput
                                    placeholder={"Email"}
                                    keyboardType={"email-address"}
                                    setState={(data) => this.setState({userEmail: data})}
                                    reference={(input) => {
                                        this._emailInput = input;
                                    }}
                                    returnKey={"next"}
                                    onSubmit={() => this._passwordInput && this._passwordInput.focus()}
                                    blur={true}
                                    style={styles.input}
                                />
                                {/*password field*/}
                                <UserInput
                                    placeholder={"Password"}
                                    keyboardType={"default"}
                                    secure={true}
                                    setState={(data) => this.setState({userPassword: data})}
                                    reference={(input) => {
                                        this._passwordInput = input;
                                    }}
                                    returnKey={"next"}
                                    onSubmit={() => this._confirmPasswordInput && this._confirmPasswordInput.focus()}
                                    blur={true}
                                    style={styles.input}
                                />
                                {/*confirm password field*/}
                                <UserInput
                                    placeholder={"Confirm Password"}
                                    keyboardType={"default"}
                                    secure={true}
                                    setState={(data) =>
                                        this.setState({userConfirmPassword: data})
                                    }
                                    reference={(input) => {
                                        this._confirmPasswordInput = input;
                                    }}
                                    returnKey={"next"}
                                    onSubmit={Keyboard.dismiss}
                                    blur={true}
                                    style={styles.input}
                                />
                                {/*address field*/}
                                {/*<UserInput
                                    placeholder={"Address"}
                                    keyboardType={"default"}
                                    setState={(data) => this.setState({userAddress: data})}
                                    reference={(input) => {
                                        this._addressInput = input;
                                    }}
                                    returnKey={"next"}
                                    onSubmit={() => this._phoneInput && this._phoneInput.focus()}
                                    blur={true}
                                    style={styles.input}
                                />*/}
                                {/*phone field*/}
                                {/*<UserInput
                                    placeholder={"Phone"}
                                    keyboardType={"phone-pad"}
                                    setState={(data) => this.setState({userPhone: data})}
                                    reference={(input) => {
                                        this._phoneInput = input;
                                    }}
                                    returnKey={"next"}
                                    onSubmit={Keyboard.dismiss}
                                    blur={true}
                                    style={styles.input}
                                />*/}
                                <TouchableOpacity onPress={() => this.REGISTER()}>
                                    <AnimatedBox
                                        bg="blue"
                                        h={theme.space["2xl"]}
                                        center
                                        align="center"
                                        style={{...styles.buttons}}
                                        radius={theme.space.lg}
                                    >
                                        <Text
                                            size={theme.text.size.sm}
                                            color='white'
                                            weight={theme.text.weight.bold}
                                        >
                                            SUBMIT
                                        </Text>
                                    </AnimatedBox>
                                </TouchableOpacity>
                            </Box>
                        </ScrollView>
                    </AnimatedBox>
                    <AwesomeAlert
                        show={this.state.showAlert}
                        showProgress={false}
                        title={this.state.alertTitle}
                        message={this.state.alertMessage}
                        closeOnTouchOutside={false}
                        closeOnHardwareBackPress={false}
                        showCancelButton={this.state.showCancelButton}
                        showConfirmButton={this.state.showConfirmButton}
                        confirmText="Login"
                        cancelText="Ok"
                        // confirmButtonColor={theme.color.accent}
                        cancelButtonColor={theme.color.redLight}
                        onConfirmPressed={() => {
                            this.setState({showAlert: false});
                        }}
                        onCancelPressed={() => {
                            this.setState({showAlert: false});
                        }}
                    />
                </Box>
            </KeyboardAvoidingView>
        );
    }
}

export default RegisterScreen;

const styles = StyleSheet.create({
    buttons: {
        marginHorizontal: theme.space.sm,
        marginVertical: theme.space["2xs"],
        elevation: 3,
        shadowOffset: {width: 2, height: 2},
        shadowColor: theme.color.black,
        shadowOpacity: theme.opacity.low,
    },
    input: {
        elevation: 3,
        backgroundColor: theme.color.white,
        fontSize: theme.text.size.base,
        borderRadius: theme.radius.xl,
        shadowOffset: {width: 2, height: 2},
        shadowColor: theme.color.black,
        shadowOpacity: theme.opacity.low,
    }
});
