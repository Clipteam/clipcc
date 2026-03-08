/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

import type {ExtensionManager} from '../extension-manager';

/**
 * Interface of extension object.
 */
export interface IExtension {
    /**
     * Attach the extension to given manager.
     * The method will be called when loading the extension.
     * @param manager Extension manager instance.
     * @internal
     */
    attachManager(manager: ExtensionManager): void;

    /**
     * Get ID of the extension.
     * @returns ID of the extension.
     */
    getId(): string;

    /**
     * Check whether the extension is enabled.
     * @returns True if the extension is enabled.
     */
    isEnabled(): boolean;

    /**
     * Enable the extension.
     */
    enable(): void;

    /**
     * Disable the extension.
     */
    disable(): void;

    /**
     * Get toolbox content for Blockly.
     * The method should only be called when extension is enabled.
     * @param isStage True if current target is stage.
     */
    getToolboxContents(isStage: boolean): any;
}
