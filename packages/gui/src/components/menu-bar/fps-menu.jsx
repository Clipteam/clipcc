import classNames from 'classnames';

import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import check from './check.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {fpsMenuOpen, openFpsMenu} from '../../reducers/menus.js';
import {updateSettings} from '../../reducers/settings';

import styles from './settings-menu.css';

import dropdownCaret from './dropdown-caret.svg';

class FPSMenu extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'setRef',
            'handleMouseOver'
        ]);
    }

    componentDidUpdate (prevProps) {
        // If the submenu has been toggled open, try scrolling the selected option into view.
        if (!prevProps.menuOpen && this.props.menuOpen && this.selectedRef) {
            this.selectedRef.scrollIntoView({block: 'center'});
        }
    }

    setRef (component) {
        this.selectedRef = component;
    }

    handleMouseOver () {
        // If we are using hover rather than clicks for submenus, scroll the selected option into view
        if (!this.props.menuOpen && this.selectedRef) {
            this.selectedRef.scrollIntoView({block: 'center'});
        }
    }

    render () {
        return (
            <MenuItem
                expanded={this.props.menuOpen}
            >
                <div
                    className={styles.option}
                    onClick={this.props.onRequestOpen}
                    onMouseOver={this.handleMouseOver}
                >
                    <span className={styles.submenuLabel}>
                        <FormattedMessage
                            defaultMessage="FPS"
                            description="FPS sub-menu"
                            id="gui.menuBar.fps"
                        />
                    </span>
                    <img
                        className={styles.expandCaret}
                        src={dropdownCaret}
                    />
                </div>
                <Submenu
                    place={this.props.isRtl ? 'left' : 'right'}
                >
                    <MenuItem onClick={() => {
                        this.props.onChangeFPS(30);
                    }}>
                        <img
                            className={classNames(styles.check, {[styles.selected]: this.props.fps === 30})}
                            src={check}
                        />
                        30 FPS
                    </MenuItem>
                    <MenuItem onClick={() => {
                        this.props.onChangeFPS(60);
                    }}>
                        <img
                            className={classNames(styles.check, {[styles.selected]: this.props.fps === 60})}
                            src={check}
                        />
                        60 FPS
                    </MenuItem>
                    <MenuItem onClick={() => {
                        this.props.onChangeFPS(120);
                    }}>
                        <img
                            className={classNames(styles.check, {[styles.selected]: this.props.fps === 120})}
                            src={check}
                        />
                        120 FPS
                    </MenuItem>
                </Submenu>
            </MenuItem>
        );
    }
}

FPSMenu.propTypes = {
    isRtl: PropTypes.bool,
    label: PropTypes.string,
    menuOpen: PropTypes.bool,
    onChangeFPS: PropTypes.func,
    onRequestCloseSettings: PropTypes.func,
    onRequestOpen: PropTypes.func
};

const mapStateToProps = state => ({
    fps: state.scratchGui.settings.framerate,
    isRtl: state.locales.isRtl,
    menuOpen: fpsMenuOpen(state)
});

const mapDispatchToProps = (dispatch, ownProps) => ({
    onRequestOpen: () => dispatch(openFpsMenu()),
    onChangeFPS: (fps) => dispatch(updateSettings({framerate: fps}))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FPSMenu);
