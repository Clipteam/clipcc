/**
 * @license
 * Copyright 2017 Massachusetts Institute of Technology
 * SPDX-License-Identifier: BSD-3-Clause
 */

import logger from '../../utils/logger';
import ExtensionManifest from '../../interfaces/extension-manifest';
import {IExtension} from '../../interfaces/i_extension';
import {ScratchBaseAdapter} from './adapter';
import {ExtensionMetadata} from './types/extension-metadata';
import {ScratchExtension, ScratchExtensionClass} from './types/scratch-extension';

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

    override enable(): void {
        const ExtensionClass = this.module();
        this.instance = new ExtensionClass(this.runtime);

        super.enable();
    }

    protected override getInfo(): ExtensionMetadata {
        return this.instance.getInfo();
    }

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
