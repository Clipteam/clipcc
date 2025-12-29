import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import bindAll from 'lodash.bindall';

import {setTheme} from '../reducers/theme';

const prefersDarkQuery = '(prefers-color-scheme: dark)';
const prefersHighContrastQuery = '(prefers-contrast: more)';

const themeManagerHOC = function (WrappedComponent) {
    class SystemPreferences extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, ['onMediaQueryChange']);
            this.onMediaQueryChange();
        }
        componentDidMount () {
            if (!window.matchMedia) return;
            this.highContrastMatchMedia = window.matchMedia(prefersHighContrastQuery);
            this.darkModeMatchMedia = window.matchMedia(prefersDarkQuery);
            if (this.darkModeMatchMedia.addEventListener) {
                this.darkModeMatchMedia.addEventListener('change', this.onMediaQueryChange);
                this.highContrastMatchMedia.addEventListener('change', this.onMediaQueryChange);
            } else {
                this.darkModeMatchMedia.addListener('change', this.onMediaQueryChange);
                this.highContrastMatchMedia.addListener('change', this.onMediaQueryChange);
            }
        }
        componentDidUpdate (prevProps) {
            if (this.props.userTheme !== prevProps.userTheme) {
                this.onMediaQueryChange();
            }
            if (this.props.theme !== prevProps.theme) {
                document.documentElement.setAttribute('theme', this.props.theme);
            }
        }
        componentWillUnmount () {
            if (!window.matchMedia) return;
            if (this.darkModeMatchMedia.removeEventListener) {
                this.highContrastMatchMedia.removeEventListener('change', this.onMediaQueryChange);
                this.darkModeMatchMedia.removeEventListener('change', this.onMediaQueryChange);
            } else {
                this.highContrastMatchMedia.removeListener('change', this.onMediaQueryChange);
                this.darkModeMatchMedia.removeListener('change', this.onMediaQueryChange);
            }
        }
        onMediaQueryChange () {
            switch (this.props.userTheme) {
            case 'system':
                if (matchMedia('(prefers-color-scheme: dark)').matches) {
                    this.props.onSetTheme('dark');
                } else {
                    this.props.onSetTheme('default');
                }
                break;
            case 'dark':
                this.props.onSetTheme('dark');
                break;
            case 'high-contrast':
                this.props.onSetTheme('high-contrast');
                break;
            default:
                this.props.onSetTheme('default');
            }
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                onSetTheme,
                userTheme,
                /* eslint-enable no-unused-vars */
                ...props
            } = this.props;
            return <WrappedComponent {...props} />;
        }
    }

    SystemPreferences.propTypes = {
        userTheme: PropTypes.string,
        theme: PropTypes.string,
        onSetTheme: PropTypes.func
    };

    const mapStateToProps = state => ({
        userTheme: state.scratchGui.settings.theme,
        theme: state.scratchGui.theme.theme
    });

    const mapDispatchToProps = dispatch => ({
        onSetTheme: theme => dispatch(setTheme(theme))
    });

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(SystemPreferences);
};

export default themeManagerHOC;
