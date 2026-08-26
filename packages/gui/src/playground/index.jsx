import React from 'react';
import ReactDOM from 'react-dom';

import analytics from '../lib/analytics';
import AppStateHOC from '../lib/app-state-hoc.tsx';
import BrowserModalComponent from '../components/browser-modal/browser-modal.tsx';
import {setAppElement} from 'react-modal';
import supportedBrowser from '../lib/supported-browser';

import styles from './index.css';

// Register "base" page view
analytics.pageview('/');

const appTarget = document.createElement('div');
appTarget.className = styles.app;
document.body.appendChild(appTarget);

if (supportedBrowser()) {
    // require needed here to avoid importing unsupported browser-crashing code
    // at the top level
    // eslint-disable-next-line global-require
    require('./render-gui').default(appTarget);

} else {
    setAppElement(appTarget);
    const WrappedBrowserModalComponent = AppStateHOC(BrowserModalComponent, true /* localesOnly */);
    const handleBack = () => {};

    ReactDOM.render(<WrappedBrowserModalComponent onBack={handleBack} />, appTarget);
}
