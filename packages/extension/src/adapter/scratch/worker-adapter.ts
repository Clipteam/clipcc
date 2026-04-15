/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

import {ScratchBaseAdapter} from './adapter';
import logger from '../../utils/logger';
import dispatch from './dispatch/central-dispatch';
import type ExtensionManifest from '../../interfaces/extension-manifest';
import type {Resolve, Reject} from './dispatch/shared-dispatch';

interface PendingExtensionWorker {
    extensionURL: string;
    resolve: Resolve;
    reject: Reject;
}

class ExtensionService {
    /**
     * The ID number to provide to the next extension worker.
     */
    private nextExtensionWorker: number = 0;

    /**
     * FIFO queue of extensions which have been requested but not yet loaded in a worker,
     * along with promise resolution functions to call once the worker is ready or failed.
     */
    private pendingExtensions: PendingExtensionWorker[] = [];

    /**
     * Map of worker ID to workers which have been allocated but have not yet finished initialization.
     */
    private pendingWorkers: PendingExtensionWorker[] = [];

    constructor(runtime: any) {
        dispatch.setService('runtime', runtime).catch(err => {
            logger.error(`Failed to register runtime service: ${JSON.stringify(err)}`);
        });
        dispatch.setService('extensions', this).catch(err => {
            logger.error(`Failed to register extension service: ${JSON.stringify(err)}`);
        });
    }

    addPendingExtension(url: string, resolve: Resolve, reject: Reject) {
        this.pendingExtensions.push({
            extensionURL: url,
            resolve,
            reject
        });
    }

    allocateWorker() {
        const id = this.nextExtensionWorker++;
        const workerInfo = this.pendingExtensions.shift()!;
        this.pendingWorkers[id] = workerInfo;
        return [id, workerInfo.extensionURL];
    }

    /**
     * Called by an extension worker to indicate that the worker has finished initialization.
     * @param id The worker ID.
     * @param err The error encountered during initialization, if any.
     */
    onWorkerInit(id: number, err?: any) {
        const workerInfo = this.pendingWorkers[id];
        if (err) {
            workerInfo.reject(err);
        }
    }

    /**
     * Collect extension metadata from the specified service and begin the extension registration process.
     * @param serviceName The name of the service hosting the extension.
     * @param id The worker ID.
     */
    registerExtensionService(serviceName: string, id: number) {
        const workerInfo = this.pendingWorkers[id];
        delete this.pendingWorkers[id];
        workerInfo.resolve(serviceName);
    }
};

let extensionService: ExtensionService | null = null;

/**
 * Scratch extension adapter for web worker extensions.
 */
export class ScratchWorkerAdapter extends ScratchBaseAdapter {
    /** The name of the service hosting the extension. */
    private serviceName!: string;

    /**
     * @param manifest Manifest for extension library to display info.
     * @param url URL to load the extension.
     * @param runtime Runtime object of virtual machine.
     */
    constructor(
        manifest: ExtensionManifest,
        private url: string,
        runtime: any
    ) {
        super(manifest, runtime);

        if (!extensionService) {
            extensionService = new ExtensionService(runtime);
        }
    }

    override enable(): Promise<void> {
        return new Promise<string>((resolve, reject) => {
            extensionService!.addPendingExtension(this.url, resolve, reject);
            dispatch.addWorker(new Worker(new URL('./extension-worker.ts', import.meta.url)));
        }).then((serviceName: string) => {
            this.serviceName = serviceName;
            return super.enable();
        });
    }

    /**
     * Refresh and cache the category info.
     */
    async refreshInfo(): Promise<void> {
        try {
            const info = await dispatch.call(this.serviceName, 'getInfo');
            this.processInfo(info);
        } catch (err) {
            logger.error(`Failed to register extension ${this.getId()}:`, err);
        }
    }

    /**
     * Call method by name and given arguments. Will only be called after instantiated.
     * @param method Method name.
     * @param args Arguments passed to method.
     * @returns Result of calling the method, or undefined if no valid method is found.
     */
    protected override callMethod<R, Args extends any[]>(method: string, ...args: Args): R | undefined {
        // Ignore the util and realBlockInfo param.
        return dispatch.call(this.serviceName, method, args[0]) as R;
    }
}
