import React, {Component} from "react";
import {Box} from "react-native-design-utility";
import {inject} from "mobx-react";

import OnboardingLogo from "../shared/OnboardingLogo";
import {SkypeIndicator} from "react-native-indicators";
import theme from "../constants/theme";

@inject("currentUser")
class SplashScreen extends Component {
    state = {};

    componentDidMount() {
        this.checkAuth();
    }

    checkAuth = () => {
        setTimeout(async () => {
            await this.props.currentUser.setupAuth();
        }, 10);
    };

    render() {
        return (
            <Box f={1} center bg="white">
                <OnboardingLogo/>
                <Box f={0.5}>
                    <SkypeIndicator size={40} color={theme.color.greenLight}/>
                </Box>
            </Box>
        );
    }
}

export default SplashScreen;
