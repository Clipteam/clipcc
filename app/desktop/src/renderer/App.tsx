import {compose} from 'redux';

import GUI, {setAppElement} from 'clipcc-gui/src/index';
import AppStateHOC from 'clipcc-gui/src/lib/app-state-hoc';

import ScratchDesktopAppStateHOC from './DesktopAppStateHOC';
// import ScratchDesktopGUIHOC from './DesktopGUIHOC';
import './app.css';
import React from 'react';

const appTarget = document.getElementById('app');

setAppElement(appTarget);

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedGui = compose(
    ScratchDesktopAppStateHOC,
    AppStateHOC,
    ScratchDesktopGUIHOC
)(GUI);

export default <WrappedGui />;
