import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import check from './check.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {DEFAULT_THEME, HIGH_CONTRAST_THEME, DARK_THEME, themeMap} from '../../lib/themes';
import {openThemeMenu, themeMenuOpen} from '../../reducers/menus.js';
import {updateSettings} from '../../reducers/settings.js';

import styles from './settings-menu.css';

import dropdownCaret from './dropdown-caret.svg';

const ThemeMenuItem = props => {
    const themeInfo = themeMap[props.theme];

    return (
        <MenuItem onClick={props.onClick}>
            <div className={styles.option}>
                <img
                    className={classNames(styles.check, {[styles.selected]: props.isSelected})}
                    src={check}
                />
                <img
                    className={styles.icon}
                    src={themeInfo.icon}
                />
                <FormattedMessage {...themeInfo.label} />
            </div>
        </MenuItem>);
};

ThemeMenuItem.propTypes = {
    isSelected: PropTypes.bool,
    onClick: PropTypes.func,
    theme: PropTypes.string
};

const ThemeMenu = ({
    isRtl,
    menuOpen,
    onChangeTheme,
    onRequestOpen,
    theme
}) => {
    const enabledThemes = [DEFAULT_THEME, HIGH_CONTRAST_THEME, DARK_THEME];
    const themeInfo = themeMap[theme];

    return (
        <MenuItem expanded={menuOpen}>
            <div
                className={styles.option}
                onClick={onRequestOpen}
            >
                <img
                    src={themeInfo.icon}
                    style={{width: 24}}
                />
                <span className={styles.submenuLabel}>
                    <FormattedMessage
                        defaultMessage="Theme"
                        description="Theme sub-menu"
                        id="gui.menuBar.theme"
                    />
                </span>
                <img
                    className={styles.expandCaret}
                    src={dropdownCaret}
                />
            </div>
            <Submenu place={isRtl ? 'left' : 'right'}>
                {enabledThemes.map(enabledTheme => (
                    <ThemeMenuItem
                        key={enabledTheme}
                        isSelected={theme === enabledTheme}
                         
                        onClick={() => onChangeTheme(enabledTheme)}
                        theme={enabledTheme}
                    />)
                )}
            </Submenu>
        </MenuItem>
    );
};

ThemeMenu.propTypes = {
    isRtl: PropTypes.bool,
    menuOpen: PropTypes.bool,
    onChangeTheme: PropTypes.func,
    // eslint-disable-next-line react/no-unused-prop-types
    onRequestCloseSettings: PropTypes.func,
    onRequestOpen: PropTypes.func,
    theme: PropTypes.string
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl,
    menuOpen: themeMenuOpen(state),
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = (dispatch, ownProps) => ({
    onChangeTheme: theme => dispatch(updateSettings({theme})),
    onRequestOpen: () => dispatch(openThemeMenu())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ThemeMenu);
