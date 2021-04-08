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

const AnimatedBox = Animated.createAnimatedComponent(Box);
const AnimatedText = Animated.createAnimatedComponent(Text);
const {width, height} = Dimensions.get("window");

@inject("currentUser")
class RegisterScreen extends Component {
    state = {
        errorText: "",
        alertTitle: "",
        alertMessage: "",

        loading: false,
        showAlert: false,
        showSuccessButton: false,
        showErrorButton: false,

        opacity: new Animated.Value(0),
        position: new Animated.Value(0),

        userName: "",
        userEmail: "",
        userPassword: "",
        userConfirmPassword: "",
    };

    componentDidMount() {
        Animated.parallel([
            this.positionAnim(), this.opacityAnim()
        ]).start();
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
        show_error = true,
        show_success = false,
        title,
        message
    ) => {
        this.setState({
            showAlert: show,
            showErrorButton: show_error,
            showSuccessButton: show_success,
            alertTitle: title,
            alertMessage: message
        });
    };

    FORGOT = async () => {
        this.setState({errorText: ""});
        if (!this.state.userEmail) {
            this.show_alert(true, true, false, "Error in input", strings.required_email);
            return;
        }

        this.setState({loading: true});

        let result = await this.props.currentUser.forgot_password(
            this.state.userEmail
        );

        console.log(result.message)
        if (result.status === 200) {
            this.show_alert(true, false, true, "Password reset link sent", result.message);
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
            outputRange: [30, 0],
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
                        style={{transform: [{translateY: logoPosition}]}}
                    >
                        <OnboardingLogo/>
                    </AnimatedBox>
                    <AnimatedBox f={1} w={"100%"} style={{opacity: opacity}}>
                        <ScrollView keyboardShouldPersistTaps="handled">
                            <Box f={1} ph={"md"}>
                                {/*email field*/}
                                <UserInput
                                    placeholder={"Email"}
                                    icon={"envelope"}
                                    keyboardType={"email-address"}
                                    secure={false}
                                    setState={(data) => this.setState({userEmail: data})}
                                    reference={(input) => {
                                        this._emailInput = input;
                                    }}
                                    returnKey={"next"}
                                    onSubmit={Keyboard.dismiss}
                                    blur={true}
                                    style={styles.input}
                                />

                                {/* <Box m={"sm"}>
                                    {this.state.errorText !== "" && (
                                        <Text color="redLighter" center>
                                            {" "}
                                            {this.state.errorText}{" "}
                                        </Text>
                                    )}
                                </Box>*/}

                                <TouchableOpacity onPress={() => this.FORGOT()}>
                                    <AnimatedBox
                                        bg="greenLight"
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
                        showCancelButton={this.state.showErrorButton}
                        showConfirmButton={this.state.showSuccessButton}
                        confirmText="Okay"
                        cancelText="Ok"
                        // confirmButtonColor={theme.color.accent}
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
