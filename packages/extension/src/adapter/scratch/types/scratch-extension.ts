/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

import {ExtensionMetadata} from './extension-metadata';

/**
 * Definition of Scratch extension class.
 */
export interface ScratchExtension {
    /**
     * Get metadata of the extension.
     * @returns Metadata for this extension and its blocks.
     */
    getInfo(): ExtensionMetadata;

    /** Other methods and properties. */
    [key: string]: unknown;
}

/**
 * Constructor for ScratchExtension.
 */
export type ScratchExtensionClass = new (runtime: any) => ScratchExtension;
