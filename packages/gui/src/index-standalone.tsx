import React from 'react';
import ReactDOM from 'react-dom';
import {setAppElement} from 'react-modal';
import GUI from './containers/gui';
import { GUIConfig } from './gui-config';
import AppStateHOC from './lib/app-state-hoc';

export {setAppElement} from 'react-modal';

export * from './gui-config';
export * from './exported-reducers';

// TODO: Export this from 'scratch-storage'
export { default as ScratchStorage } from 'clipcc-storage';
export * from 'clipcc-storage';

export { default as defaultProject } from './lib/default-project';

// TODO: Better typing once ScratchGUI has types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GUIProps = any; // ComponentPropsWithoutRef<typeof ScratchGUI>;

/**
 * Creates a "root" for the editor to be hosted in.
 *
 * @param {GUIConfig} config The configuration for the editor.
 * @param {HTMLElement} rootAppElement The main app element, set to ReactModal.setAppElement.
 * @param {HTMLElement} container The container the editor should be hosted under.
 *
 * @returns {{ render: function(props: GUIProps): void, unmount: function(): void }} The mounted root.
 */
export const createStandaloneRoot = (
    config: GUIConfig,
    rootAppElement: HTMLElement,
    container: HTMLElement,
) => {
    setAppElement(rootAppElement);

    const GUIWithState = AppStateHOC(GUI, false, () => config);

    return {
        render (props: GUIProps) {
            ReactDOM.render(<GUIWithState {...props} />, container);
        },

        unmount () {
            ReactDOM.unmountComponentAtNode(container);
        }
    };
};
