// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React from 'react';
import {compose} from 'redux';

import GUI from 'clipcc-gui/src/index';
import AppStateHOC from 'clipcc-gui/src/lib/app-state-hoc.jsx';
import style from './app.css';
import DesktopHOC from './desktop-hoc';

const appTarget = document.getElementById('app');
appTarget.className = style.app;

// eslint-disable-next-line import/no-named-as-default-member
GUI.setAppElement(appTarget);

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedGui = compose(
    AppStateHOC,
    DesktopHOC
)(GUI);

export default <WrappedGui />;