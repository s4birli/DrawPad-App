import React from "react";
import {Box, Text} from "react-native-design-utility";
import {TouchableOpacity} from "react-native";

const Button = ({
                    text,
                    btnColor,
                    textColor,
                    textSize,
                    btnPadding,
                    onButtonPress,
                    style,
                    radius,
                }) => (
    <TouchableOpacity style={style} activeOpacity={0.5} onPress={onButtonPress}>
        <Box bg={btnColor} p={btnPadding} align="center" center radius={radius}>
            <Text size={textSize} color={textColor}>
                {text}
            </Text>
        </Box>
    </TouchableOpacity>
);

export default Button;
