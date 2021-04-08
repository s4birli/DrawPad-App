import React from 'react';
import {Box} from 'react-native-design-utility';
import {StyleSheet, TextInput} from 'react-native';

import theme from '../constants/theme';

const UserInput = ({
                       style, placeholder, icon = null, track = false,
                       keyboardType, secure = false, setState, reference, onSubmit,
                       blur, returnKey, marginRight = 'sm', marginLeft = 'sm', multiline = false,
                       lines, contentSize = null, editable = true, height = '2xl', val = null
                   }) => (
    <Box style={styles.inputWrap} h={theme.space[height]} mr={marginRight} ml={marginLeft}>
        {/* <Box p='xs' bg='greenLight' align='center' center>
      <Icon
        style={styles.icon}
        name={icon}
        type='font-awesome'
        size={22}
        color='#fff'
      />
    </Box> */}
        <TextInput
            style={[styles.input, style]}
            placeholder={placeholder}
            keyboardType={keyboardType}
            secureTextEntry={secure}
            onChangeText={setState}
            returnKeyType={returnKey}
            ref={reference}
            onSubmitEditing={onSubmit}
            blurOnSubmit={blur}
            multiline={multiline}
            numberOfLines={lines}
            underlineColorAndroid="transparent"
            onContentSizeChange={contentSize}
            editable={editable}
            value={val}

        />
    </Box>
);

const styles = StyleSheet.create({
    inputWrap: {
        marginVertical: 5,
    },
    input: {
        flex: 1,
        paddingHorizontal: 10,
    },
    icon: {
        width: 25,
        height: 25,
    },
});

export default UserInput;
