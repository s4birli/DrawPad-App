import React from 'react';
import {Modal, StyleSheet, Text, View} from 'react-native';
import {SkypeIndicator} from 'react-native-indicators';

import theme from '../constants/theme';

const Loader = props => {
    let {loading, ...attributes} = props;

    return (
        <Modal
            transparent={true}
            animationType={'fade'}
            visible={loading}>
            {/*  onRequestClose={() => {
             console.log('close modal');
             }}*/}

            <View style={styles.modalBackground}>
                <View style={styles.activityIndicatorWrapper}>
                    <Text>Please Wait...</Text>
                    <SkypeIndicator color={theme.color.primary} size={20} animating={loading}/>

                    {/* <Box dir={'row'}>
                     <BallIndicator color='white' size={20}/>
                     <BarIndicator color='white' size={20}/>
                     <DotIndicator color='white' size={20}/>
                     </Box>
                     <Box dir={'row'}>
                     <MaterialIndicator color='white' size={20}/>
                     <PacmanIndicator color='white' size={20}/>
                     <PulseIndicator color='white' size={20}/>
                     </Box>
                     <Box dir={'row'}>
                     <SkypeIndicator color='white' size={20}/>
                     <UIActivityIndicator color='white' size={20}/>
                     <WaveIndicator color='white' size={20}/>
                     </Box>*/}
                </View>
            </View>
        </Modal>
    );
};
export default Loader;

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'space-around',
        backgroundColor: '#00000040',
    },
    activityIndicatorWrapper: {
        backgroundColor: '#FFFFFF',
        height: 100,
        width: 100,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
});