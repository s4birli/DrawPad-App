import React from "react";
import {Dimensions, Image} from "react-native";
import images from "../constants/images";
import {Box} from "react-native-design-utility";

const {width, height} = Dimensions.get("window");
const OnboardingLogo = () => (
    <Box center>
        <Image
            source={images.logo}
            style={{width: width / 1.5, height: height / 1.5, resizeMode: "contain"}}
        />
    </Box>
);

export default OnboardingLogo;
