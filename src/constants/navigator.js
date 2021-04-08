import React, {Component} from 'react';

import AppNavigator from '../screens';
import {NavigationService} from '../api/NavigationService';

class Navigation extends Component {
    render() {
        return (
            <AppNavigator ref={r => NavigationService.setTopLevelNavigator(r)}/>
        );
    }
}

export default Navigation