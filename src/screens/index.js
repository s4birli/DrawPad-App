import React from 'react'
import {createStackNavigator} from "react-navigation-stack";
import {createBottomTabNavigator} from "react-navigation-tabs";
import {createAppContainer, createSwitchNavigator} from "react-navigation";
import {Icon} from "react-native-elements";
import {
    FlexibleTabBarComponent,
    withCustomStyle
} from 'react-navigation-custom-bottom-tab-component/FlexibleTabBarComponent';

import theme from '../constants/theme';
import ActionBar from "../components/ActionBar";

const AuthNavigator = createStackNavigator(
    {
        Login: {
            getScreen: () => require("./auth/LoginScreen").default,
        },
        Register: {
            getScreen: () => require("./auth/RegisterScreen").default,
        },
        ForgotPassword: {
            getScreen: () => require("./auth/ForgotPasswordScreen").default,
        },
    },
    {
        headerMode: "none",
    }
);

const HomeStack = createStackNavigator({
    Home: {
        getScreen: () => require('./app/HomeScreen').default,
    },
}, {
    navigationOptions: {
        title: 'Home',
        tabBarIcon: ({focused}: { focused: boolean }) => (
            <Icon name='home' type='font-awesome' size={25}
                  color={focused ? theme.color.greenLight : theme.color.white}/>
        ),
    }, headerMode: 'none'
})

const ProfileStack = createStackNavigator({
    Profile: {
        getScreen: () => require('./app/ProfileScreen').default,
    },
}, {
    navigationOptions: {
        title: 'Profile',
        tabBarIcon: ({focused}: { focused: boolean }) => (
            <Icon name='user' type='font-awesome' color={focused ? theme.color.greenLight : theme.color.white}
                  size={25}/>
        ),
    }, headerMode: 'none'
})

const SettingsStack = createStackNavigator({
    Settings: {
        getScreen: () => require('./app/SettingsScreen').default,
    },
}, {
    navigationOptions: {
        title: 'Settings',
        tabBarIcon: ({focused}: { focused: boolean }) => (
            <Icon name='gear' type='font-awesome' color={focused ? theme.color.greenLight : theme.color.white}
                  size={25}/>
        ),
    }, headerMode: 'none'
})

const TabNavigator = createBottomTabNavigator({
    Home: HomeStack,
    Profile: ProfileStack,
    // Settings: SettingsStack
}, {
    tabBarComponent: (withCustomStyle({
        style: {
            backgroundColor: theme.color.greenLight
        },
        backgroundViewStyle: {
            backgroundColor: theme.color.white
        },
        labelStyle: {
            fontSize: theme.text.size.sm
        },
        tabBarHeight: theme.space['2xl'],
        activeTintColor: theme.color.greenLight,
        inactiveTintColor: theme.color.greyDark,
        useNativeDriver: false,
    })(FlexibleTabBarComponent)),
    navigationOptions: {
        header: () => <ActionBar/>
    },
    tabBarPosition: 'bottom',
})

const MainNavigator = createStackNavigator({
    Tab: TabNavigator,
    NewProcedure: {
        getScreen: () => require('./app/NewProcedureScreen').default,
    },
    SavedProcedures: {
        getScreen: () => require('./app/SavedProceduresScreen').default,
    },
    PDFProcedures: {
        getScreen: () => require('./app/PDFProceduresScreen').default,
    },
})

const AppNavigator = createSwitchNavigator(
    {
        Splash: {
            getScreen: () => require("./SplashScreen").default,
        },
        Auth: AuthNavigator,
        App: MainNavigator,
    },
    {
        initialRouteName: "Splash",
    }
);

export default createAppContainer(AppNavigator);
