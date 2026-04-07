import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {compose} from 'redux';

import Box from '../components/box/box.jsx';
import GUI from '../containers/gui.tsx';
import HashParserHOC from '../lib/hash-parser-hoc.tsx';
import AppStateHOC from '../lib/app-state-hoc.tsx';

if (process.env.NODE_ENV === 'production' && typeof window === 'object') {
    // Warn before navigating away
    window.onbeforeunload = () => true;
}

import styles from './player.css';

class GUIComponent extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            showGUI: true
        };
    }

    render () {
        return (
            <Box className={styles.editor}>
                <button
                    onClick={() => {
                        this.setState({showGUI: !this.state.showGUI});
                    }}
                >{this.state.showGUI ? 'Unmount' : 'Mount'}</button>
                {this.state.showGUI && (
                    <GUI
                        canEditTitle
                        projectId={this.props.projectId}
                    />
                )}
            </Box>
        );
    }
}

GUIComponent.propTypes = {
    projectId: PropTypes.string
};

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedGUI = compose(
    AppStateHOC,
    HashParserHOC
)(GUIComponent);

const appTarget = document.createElement('div');
document.body.appendChild(appTarget);

ReactDOM.render(<WrappedGUI />, appTarget);
