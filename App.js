import React, {Component} from "react";
import {Box, Text, UtilityThemeProvider} from "react-native-design-utility";
import {SkypeIndicator} from "react-native-indicators";
import {Provider} from "mobx-react";
import {LogBox, Platform} from "react-native";

import GeneralStatusBarColor from "./src/components/statusbar/GeneralStatusBarColor";
import {cacheImages} from "./src/utils/cacheimages";
import Navigation from "./src/constants/navigator";
import theme from "./src/constants/theme";
import images from "./src/constants/images";
import {store} from "./src/models";

LogBox.ignoreAllLogs(true)

class App extends Component {
    state = {
        isReady: false,
    };

    componentDidMount() {
        this.cacheAssets().then();
    }

    cacheAssets = async () => {
        const imageAssets = cacheImages([...Object.values(images)]);
        await Promise.all([...imageAssets]);
        this.setState({isReady: true});
    };

    render() {

        if (!this.state.isReady) {
            return (
                <Box f={1} center bg="white">
                    <SkypeIndicator size={40} color={"green"}/>
                    <Text color={"green"}>Caching images...</Text>
                </Box>
            );
        }

        return (
            <Provider {...store}>
                <Box f={1}>
                    <GeneralStatusBarColor
                        backgroundColor={theme.color.greyDarker}
                        barStyle="light-content"
                    />
                    <UtilityThemeProvider theme={theme}>
                        <Navigation/>
                    </UtilityThemeProvider>
                </Box>
            </Provider>
        );
    }
}

export default App;