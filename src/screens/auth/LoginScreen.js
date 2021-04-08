import React, {Component} from "react";
import {Dimensions, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity,} from "react-native";
import {inject} from "mobx-react";
import {Box, Text} from "react-native-design-utility";
import Animated, {Easing} from "react-native-reanimated";
import {State, TapGestureHandler} from "react-native-gesture-handler";
import AwesomeAlert from "react-native-awesome-alerts";

import Loader from "../../components/Loader";
import strings from "../../constants/strings";
import theme from "../../constants/theme";
import UserInput from "../../shared/UserInput";
import {NavigationService} from "../../api/NavigationService";
import OnboardingLogo from "../../shared/OnboardingLogo";
import {Checkbox} from "galio-framework";

const {width, height} = Dimensions.get("window");
const {
    set,
    cond,
    eq,
    startClock,
    stopClock,
    clockRunning,
    block,
    Value,
    Clock,
    event,
    interpolate,
    Extrapolate,
    concat,
    timing,
} = Animated;
const AnimatedBox = Animated.createAnimatedComponent(Box);
const AnimatedText = Animated.createAnimatedComponent(Text);

function runTiming(clock, value, dest) {
    const state = {
        finished: new Value(0),
        position: new Value(0),
        time: new Value(0),
        frameTime: new Value(0),
    };

    const config = {
        duration: 400,
        toValue: new Value(0),
        easing: Easing.inOut(Easing.ease),
    };

    return [
        cond(clockRunning(clock), 0, [
            // If the clock isn't running we reset all the animation params and start the clock
            set(state.finished, 0),
            set(state.time, 0),
            set(state.position, value),
            set(state.frameTime, 0),
            set(config.toValue, dest),
            startClock(clock),
        ]),
        // we run the step here that is going to update position
        timing(clock, state, config),
        // if the animation is over we stop the clock
        cond(state.finished, stopClock(clock)),
        // we made the block return the updated position
        state.position,
    ];
}

@inject("currentUser")
class LoginScreen extends Component {
    state = {
        userEmail: "",
        userPassword: "",
        errorText: "",
        alertTitle: "",
        alertMessage: "",

        loading: false,
        showAlert: false,
        showConfirmButton: false,
        showCancelButton: false,

        position: new Animated.Value(0),
    };

    constructor(props) {
        super(props);

        this.buttonOpacity = new Value(1);
        this.onStateChange = event([
            {
                nativeEvent: ({state}) =>
                    block([
                        cond(
                            eq(state, State.END),
                            set(this.buttonOpacity, runTiming(new Clock(), 1, 0))
                        ),
                    ]),
            },
        ]);
        this.onCloseState = event([
            {
                nativeEvent: ({state}) =>
                    block([
                        cond(
                            eq(state, State.END),
                            set(this.buttonOpacity, runTiming(new Clock(), 0, 1))
                        ),
                    ]),
            },
        ]);
        this.buttonY = interpolate(this.buttonOpacity, {
            inputRange: [0, 1],
            outputRange: [100, 0],
            extrapolate: Extrapolate.CLAMP,
        });
        this.bgY = interpolate(this.buttonOpacity, {
            inputRange: [0, 1],
            outputRange: [-height / 6 - 1, 0],
            extrapolate: Extrapolate.CLAMP,
        });
        this.textInputZindex = interpolate(this.buttonOpacity, {
            inputRange: [0, 1],
            outputRange: [1, -1],
            extrapolate: Extrapolate.CLAMP,
        });
        this.textInputOpacity = interpolate(this.buttonOpacity, {
            inputRange: [0, 1],
            outputRange: [1, 0],
            extrapolate: Extrapolate.CLAMP,
        });
        this.textInputY = interpolate(this.buttonOpacity, {
            inputRange: [0, 1],
            outputRange: [0, 100],
            extrapolate: Extrapolate.CLAMP,
        });
        this.rotateCross = interpolate(this.buttonOpacity, {
            inputRange: [0, 1],
            outputRange: [180, 360],
            extrapolate: Extrapolate.CLAMP,
        });
    }

    componentDidMount() {
        this.positionAnim();
    }

    positionAnim = () => {
        timing(this.state.position, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
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

    LOGIN = async () => {
        this.setState({errorText: ""});
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

        this.setState({loading: true});

        const result = await this.props.currentUser.login(
            this.state.userEmail,
            this.state.userPassword,
            Platform.OS === 'ios' ? strings.ios : strings.android
        );
        console.log(result.message)
        if (result.status === 200) {
            if (result.data.user.mas_safety_user) {
                await this.props.currentUser.saveAuthToken(result.data.token);
                // Toast.show(result.message, Toast.LONG, Toast.BOTTOM);
                NavigationService.navigate('App');
            } else {
                this.show_alert(
                    true,
                    true,
                    false,
                    "Unauthorized access",
                    'You are not authorized to use this application'
                );
                await this.props.currentUser.logout(Platform.OS === 'ios' ? strings.ios : strings.android, result.data.token)
                NavigationService.navigate('Auth');
            }
        } else {
            let res = JSON.parse(result)
            let errors = res.data
            console.log(res)
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
        const logoPosition = this.state.position.interpolate({
            inputRange: [0, 1],
            outputRange: [80, 0],
        });

        return (
            // parent
            <KeyboardAvoidingView
                style={{
                    flex: 1,
                    backgroundColor: "greyLightest",
                    justifyContent: "flex-end",
                }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                enabled
            >
                <Box
                    f={1}
                    center
                    bg="greyLightest"
                    style={{justifyContent: "flex-end"}}
                >
                    <Loader loading={this.state.loading}/>
                    {/* image */}
                    {/* <AnimatedBox
                     style={{
                     ...StyleSheet.absoluteFill,
                     transform: [{ translateY: this.bgY }],
                     }}
                     >
                     <Svg height={height + 50} width={width}>
                     <ClipPath id="circleClip">
                     <Circle r={height + 50} cx={width / 2} />
                     </ClipPath>
                     <Image
                     href={images.logo}
                     height={height + 1}
                     width={width}
                     preserveAspectRatio="xMidYMid"
                     clipPath="url(#circleClip)"
                     />
                     </Svg>
                     </AnimatedBox> */}
                    <AnimatedBox
                        f={1}
                        align={"center"}
                        center
                        // style={{transform: [{translateY: logoPosition}]}}
                        style={{
                            ...StyleSheet.absoluteFill,
                            transform: [{translateY: this.bgY}],
                        }}
                    >
                        <OnboardingLogo/>
                    </AnimatedBox>

                    {/* buttons */}
                    <Box h={height / 3} w={width} justifyContent="center">
                        {/* signin button */}
                        <TapGestureHandler onHandlerStateChange={this.onStateChange}>
                            <AnimatedBox
                                bg="greenLight"
                                h={theme.space["2xl"]}
                                center
                                align="center"
                                style={{
                                    ...styles.buttons,
                                    opacity: this.buttonOpacity,
                                    transform: [{translateY: this.buttonY}],
                                }}
                                radius={theme.space.lg}
                            >
                                <Text
                                    size={theme.text.size.sm}
                                    color={"white"}
                                    weight={theme.text.weight.bold}
                                >
                                    SIGN IN
                                </Text>
                            </AnimatedBox>
                        </TapGestureHandler>

                        {/* register button */}
                        <TouchableOpacity
                            onPress={() => NavigationService.navigate("Register")}
                        >
                            <AnimatedBox
                                h={theme.space["2xl"]}
                                center
                                align="center"
                                bg="blue"
                                style={{
                                    ...styles.buttons,
                                    opacity: this.buttonOpacity,
                                    transform: [{translateY: this.buttonY}],
                                }}
                                radius={theme.space.lg}
                            >
                                <Text
                                    size={theme.text.size.sm}
                                    color="white"
                                    weight={theme.text.weight.bold}
                                >
                                    REGISTER
                                </Text>
                            </AnimatedBox>
                        </TouchableOpacity>

                        <AnimatedBox
                            h={height / 3}
                            style={{
                                ...StyleSheet.absoluteFill,
                                top: null,
                                zIndex: this.textInputZindex,
                                opacity: this.textInputOpacity,
                                transform: [{translateY: this.textInputY}],
                            }}
                            justifyContent="center"
                        >
                            <TapGestureHandler onHandlerStateChange={this.onCloseState}>
                                <AnimatedBox
                                    h={theme.space.xl}
                                    w={theme.space.xl}
                                    radius={"lg"}
                                    bg={"white"}
                                    align="center"
                                    justifyContent="center"
                                    style={{
                                        top: -30,
                                        position: "absolute",
                                        left: width / 2 - 20,
                                        shadowOffset: {width: 2, height: 2},
                                        shadowColor: theme.color.black,
                                        shadowOpacity: theme.opacity.low,
                                        elevation: 3,
                                    }}
                                >
                                    <AnimatedText
                                        style={{
                                            transform: [{rotate: concat(this.rotateCross, "deg")}],
                                        }}
                                    >
                                        X
                                    </AnimatedText>
                                </AnimatedBox>
                            </TapGestureHandler>
                            {/*email field*/}
                            {/* <NeuInput onChangeText={setText} value={text} placeholder='Text Input...'/> */}
                            <UserInput
                                placeholder={"Email"}
                                icon={"envelope"}
                                keyboardType={"email-address"}
                                setState={(data) => this.setState({userEmail: data})}
                                reference={(input) => {
                                    this._emailInput = input;
                                }}
                                returnKey={"next"}
                                onSubmit={() =>
                                    this._passwordInput && this._passwordInput.focus()
                                }
                                blur={true}
                                style={styles.input}
                            />

                            {/*password field*/}
                            <UserInput
                                placeholder={"Password"}
                                icon={"lock"}
                                keyboardType={"default"}
                                secure={true}
                                setState={(data) => this.setState({userPassword: data})}
                                reference={(input) => {
                                    this._passwordInput = input;
                                }}
                                returnKey={null}
                                onSubmit={Keyboard.dismiss}
                                blur={false}
                                style={styles.input}
                            />

                            <Box dir={'row'} w={'100%'} mr={'sm'} ml={'sm'}>
                                <Box m={'xs'} style={{justifyContent: 'flex-start'}}
                                     f={0.5}>
                                    <Checkbox
                                        color={theme.color.greenLight}
                                        value={this.state.remember_me}
                                        label="Remember me"
                                        onChange={(val) => this.setState({remember_me: val})}
                                    />
                                </Box>

                                <Box m={'xs'} style={{justifyContent: 'flex-end'}} f={0.8}>
                                    {/*forgot password text*/}
                                    <TouchableOpacity
                                        activeOpacity={0.5}
                                        onPress={() => NavigationService.navigate('ForgotPassword')}
                                    >
                                        <Text color="black" center>
                                            {strings.forgot}
                                        </Text>
                                    </TouchableOpacity>
                                </Box>
                            </Box>

                            <TouchableOpacity onPress={() => this.LOGIN()}>
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
                                        color={'white'}
                                        weight={theme.text.weight.bold}
                                    >
                                        SIGN IN
                                    </Text>
                                </AnimatedBox>
                            </TouchableOpacity>
                            {this.state.errorText !== "" && (
                                <Text size={"sm"} color="purpleDarkest" center>
                                    {" "}
                                    {this.state.errorText}{" "}
                                </Text>
                            )}
                        </AnimatedBox>
                    </Box>
                    <AwesomeAlert
                        show={this.state.showAlert}
                        showProgress={false}
                        title={this.state.alertTitle}
                        message={this.state.alertMessage}
                        closeOnTouchOutside={false}
                        closeOnHardwareBackPress={false}
                        showCancelButton={false}
                        showConfirmButton={true}
                        cancelText={this.state.cancelText}
                        confirmText="Ok"
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

export default LoginScreen;

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

