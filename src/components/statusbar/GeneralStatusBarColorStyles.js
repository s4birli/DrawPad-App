import {Platform, StatusBar, StyleSheet} from 'react-native';

export const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 35 : StatusBar.currentHeight;
export default StyleSheet.create({statusBar: {height: STATUS_BAR_HEIGHT}});
