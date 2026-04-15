/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

import logger from '../../utils/logger';
import {ScratchBaseAdapter} from './adapter';
import type ExtensionManifest from '../../interfaces/extension-manifest';
import type {ScratchExtension, ScratchExtensionClass} from './types/scratch-extension';

/**
 * Scratch extension adapter for builtin extensions provided by Scratch VM.
 */
export class ScratchBuiltinAdapter extends ScratchBaseAdapter {
    /** Instance of extension object. */
    protected instance!: ScratchExtension;

    /**
     * @param manifest Manifest for extension library to display info.
     * @param module Function that returns a constructor of Scratch extension.
     * @param runtime Runtime object of virtual machine.
     */
    constructor(
        manifest: ExtensionManifest,
        protected module: () => ScratchExtensionClass,
        runtime: any
    ) {
        super(manifest, runtime);
    }

    override enable(): Promise<void> {
        const ExtensionClass = this.module();
        this.instance = new ExtensionClass(this.runtime);
        return super.enable();
    }

    /**
     * Refresh and cache the category info.
     */
    async refreshInfo(): Promise<void> {
        try {
            this.processInfo(this.instance.getInfo());
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
        if (
            method in this.instance &&
            typeof this.instance[method] === 'function'
        ) {
            return this.instance[method](...args);
        }

        logger.error(`Could not find function "${method}" in ${this.getId()}`);
        return undefined;
    }
}
