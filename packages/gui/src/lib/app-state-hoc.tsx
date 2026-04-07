import React from 'react';
import {Provider} from 'react-redux';
import {createStore, combineReducers, compose} from 'redux';
import type {Reducer, Store, StoreEnhancer} from 'redux';
import ConnectedIntlProvider from './connected-intl-provider.jsx';

import localesReducer, {initLocale, localesInitialState} from '../reducers/locales';
import type {LocalesState} from '../reducers/locales';

import {setPlayer, setFullScreen} from '../reducers/mode';

import locales from 'clipcc-l10n';
import {detectLocale} from './detect-locale';
import type {GuiState} from '../reducers/gui';

type ComposeEnhancers = typeof compose;

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: ComposeEnhancers;
    }
}

const composeEnhancers: ComposeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

interface AppStateProps {
    isFullScreen?: boolean;
    isPlayerOnly?: boolean;
    isTelemetryEnabled?: boolean;
    showTelemetryModal?: boolean;
}

/*
 * Higher Order Component to provide redux state. If an `intl` prop is provided
 * it will override the internal `intl` redux state
 * @param {React.Component} WrappedComponent - component to provide state for
 * @param {boolean} localesOnly - only provide the locale state, not everything
 *                      required by the GUI. Used to exclude excess state when
                        only rendering modals, not the GUI.
 * @returns {React.Component} component with redux and intl state provided
 */
const AppStateHOC = function <P extends Record<string, unknown>>(
    WrappedComponent: React.ComponentType<P>,
    localesOnly?: boolean
): React.ComponentType<P & AppStateProps> {
    class AppStateWrapper extends React.Component<P & AppStateProps> {
        private store!: Store<unknown>;

        constructor (props: P & AppStateProps) {
            super(props);
            let initializedLocales: LocalesState = localesInitialState;
            const locale = detectLocale(Object.keys(locales));
            if (locale !== 'en') {
                initializedLocales = initLocale(initializedLocales, locale);
            }
            if (localesOnly) {
                // Used for instantiating minimal state for the unsupported
                // browser modal
                const reducers = {locales: localesReducer};
                const initialState = {locales: initializedLocales};
                const enhancer: StoreEnhancer<unknown> = composeEnhancers();
                const reducer = combineReducers(reducers);
                this.store = createStore(
                    reducer,
                    initialState,
                    enhancer
                );
            } else {
                // You are right, this is gross. But it's necessary to avoid
                // importing unneeded code that will crash unsupported browsers.
                // eslint-disable-next-line global-require
                const guiRedux: typeof import('../reducers/gui') = require('../reducers/gui');
                const guiReducer = guiRedux.default;
                const {
                    guiInitialState,
                    guiMiddleware,
                    initFullScreen,
                    initPlayer,
                    initTelemetryModal
                } = guiRedux;
                // eslint-disable-next-line global-require
                const {ScratchPaintReducer}: {ScratchPaintReducer: Reducer<unknown>} = require('clipcc-paint');

                let initializedGui: GuiState = guiInitialState;
                if (props.isFullScreen || props.isPlayerOnly) {
                    if (props.isFullScreen) {
                        initializedGui = initFullScreen(initializedGui);
                    }
                    if (props.isPlayerOnly) {
                        initializedGui = initPlayer(initializedGui);
                    }
                } else if (props.showTelemetryModal) {
                    initializedGui = initTelemetryModal(initializedGui);
                }
                const reducers = {
                    locales: localesReducer,
                    scratchGui: guiReducer,
                    scratchPaint: ScratchPaintReducer
                };
                const initialState = {
                    locales: initializedLocales,
                    scratchGui: initializedGui
                };
                const enhancer: StoreEnhancer<unknown> = composeEnhancers(guiMiddleware);
                const reducer = combineReducers(reducers);
                this.store = createStore(
                    reducer,
                    initialState,
                    enhancer
                );
            }
        }
        componentDidUpdate (prevProps: Readonly<P & AppStateProps>): void {
            if (localesOnly) return;
            if (
                prevProps.isPlayerOnly !== this.props.isPlayerOnly &&
                typeof this.props.isPlayerOnly === 'boolean'
            ) {
                this.store.dispatch(setPlayer(this.props.isPlayerOnly));
            }
            if (
                prevProps.isFullScreen !== this.props.isFullScreen &&
                typeof this.props.isFullScreen === 'boolean'
            ) {
                this.store.dispatch(setFullScreen(this.props.isFullScreen));
            }
        }
        render (): JSX.Element {
            const {
                isFullScreen, // eslint-disable-line no-unused-vars
                isPlayerOnly, // eslint-disable-line no-unused-vars
                showTelemetryModal, // eslint-disable-line no-unused-vars
                ...componentProps
            } = this.props;
            return (
                <Provider store={this.store}>
                    <ConnectedIntlProvider>
                        <WrappedComponent
                            {...(componentProps as P)}
                        />
                    </ConnectedIntlProvider>
                </Provider>
            );
        }
    }
    return AppStateWrapper;
};

export default AppStateHOC;
