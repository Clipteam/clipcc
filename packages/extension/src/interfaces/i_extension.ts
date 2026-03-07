/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * Interface of extension object.
 */
export interface IExtension {
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
}
