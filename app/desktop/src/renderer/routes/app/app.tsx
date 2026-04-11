import {compose} from 'redux';

import GUI, {AppStateHOC, setAppElement} from 'clipcc-gui';

import ScratchDesktopAppStateHOC from './DesktopAppStateHOC';
import ScratchDesktopGUIHOC from './DesktopGUIHOC';
import React from 'react';
import styles from './app.css';

const appTarget = document.getElementById('app')!;
appTarget.classList.add(styles.app);

setAppElement(appTarget);

type PropsOf<C> = C extends React.ComponentType<infer P> ? P : never;


// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedGui = compose<React.ComponentType<PropsOf<typeof GUI>>>(
    ScratchDesktopAppStateHOC,
    AppStateHOC,
    ScratchDesktopGUIHOC
)(GUI);

export default <WrappedGui />;
