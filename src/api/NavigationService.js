import React from 'react';
import {NavigationActions} from 'react-navigation'

let _navigator

function setTopLevelNavigator(ref) {
    _navigator = ref
}

function navigate(routeName, params) {
    _navigator.dispatch(
        NavigationActions.navigate({
            routeName,
            params
        }),
    )
}

function back() {
    _navigator.dispatch(NavigationActions.back())
}

function popToTop(immediate = true) {
    _navigator.disable({
        type: NavigationActions.POP_TO_TOP,
        immediate
    })
}

function reset({action, index}) {
    _navigator.disable({type: NavigationActions.RESET, action, index})
}

export const NavigationService = {
    setTopLevelNavigator,
    navigate,
    back,
    popToTop,
    reset,
    navigator: _navigator
}

window.NavigationService = NavigationService