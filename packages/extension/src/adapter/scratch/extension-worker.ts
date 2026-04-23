/**
 * @license
 * Copyright 2017 Massachusetts Institute of Technology
 * SPDX-License-Identifier: BSD-3-Clause
 */

import dispatch from './dispatch/worker-dispatch';

import ArgumentType from './types/argument-type';
import BlockType from './types/block-type';
import TargetType from './types/target-type';

declare global {
    var Scratch: {
        ArgumentType: typeof ArgumentType;
        BlockType: typeof BlockType;
        TargetType: typeof TargetType;
        extensions: {
            register: (extensionObject: any) => Promise<void>;
        };
    };
}

class ExtensionWorker {
    private nextExtensionId: number = 0;
    private initialRegistrations: Promise<any>[] | null = [];
    private workerId!: number;
    private extensions: any[] = [];

    constructor() {
        dispatch.waitForConnection.then(() => {
            dispatch.call('extensions', 'allocateWorker').then(x => {
                const [id, extension] = x;
                this.workerId = id;

                try {
                    importScripts(extension);

                    const initialRegistrations = this.initialRegistrations;
                    this.initialRegistrations = null;

                    Promise.all(initialRegistrations!)
                        .then(() => dispatch.call('extensions', 'onWorkerInit', id));
                } catch (e) {
                    dispatch.call('extensions', 'onWorkerInit', id, e);
                }
            });
        });
    }

    register(extensionObject: any) {
        const extensionId = this.nextExtensionId++;
        this.extensions.push(extensionObject);
        const serviceName = `extension.${this.workerId}.${extensionId}`;
        const promise = dispatch.setService(serviceName, extensionObject)
            .then(() => dispatch.call('extensions', 'registerExtensionService', serviceName, this.workerId));
        if (this.initialRegistrations) {
            this.initialRegistrations.push(promise);
        }
        return promise;
    }
}

global.Scratch = global.Scratch || {};
global.Scratch.ArgumentType = ArgumentType;
global.Scratch.BlockType = BlockType;
global.Scratch.TargetType = TargetType;

/**
 * Expose only specific parts of the worker to extensions.
 */
const extensionWorker = new ExtensionWorker();
global.Scratch.extensions = {
    register: extensionWorker.register.bind(extensionWorker)
};
