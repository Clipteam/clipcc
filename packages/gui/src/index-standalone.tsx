import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {setAppElement} from 'react-modal';
import {createStore, combineReducers, compose} from 'redux';
import GUI from './containers/gui';
import {guiInitialState, guiMiddleware, guiReducers} from './exported-reducers';


export {default as GUI} from './containers/gui.jsx';
export {default as AppStateHOC} from './lib/app-state-hoc.jsx';
export {remixProject} from './reducers/project-state.js';
export {setAppElement} from 'react-modal';

export * from './exported-reducers';

// TODO: Better typing once ScratchGUI has types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GUIProps = any; // ComponentPropsWithoutRef<typeof ScratchGUI>;

/**
 * Creates a "root" for the editor to be hosted in.
 *
 * @param {HTMLElement} rootAppElement The main app element, set to ReactModal.setAppElement.
 * @param {HTMLElement} container The container the editor should be hosted under.
 *
 * @returns {{ render: function(props: GUIProps): void, unmount: function(): void }} The mounted root.
 */
export const createStandaloneRoot = (
    rootAppElement: HTMLElement,
    container: HTMLElement
) => {
    setAppElement(rootAppElement);

    const store = createStore(
        combineReducers(guiReducers),
        {scratchGui: guiInitialState},
        compose(
            // applyMiddleware(thunk),
            guiMiddleware
        )
    );

    return {
        render (props: GUIProps) {
            ReactDOM.render(
                <Provider store={store}>
                    <GUI {...props} />
                </Provider>,
                container
            );
        },

        unmount () {
            ReactDOM.unmountComponentAtNode(container);
        }
    };
};
