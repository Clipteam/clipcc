/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

import {EventEmitter} from 'events';
import {IExtension} from './interfaces/i_extension';

/**
 * Class to manage all of the extensions.
 */
export class ExtensionManager {
    /** Map from ID to all loaded extensions. */
    private loadedExtensions: Map<string, IExtension> = new Map();

    /** Event emitter. */
    private eventEmitter: EventEmitter = new EventEmitter();

    constructor() {}

    /**
     * Load a extension to editor. The method only adds the extension to
     * manager, and the extension will still be disabled until `enableExtension`
     * is called.
     * @throws Will throw an error if extension already loaded.
     * @param extension The extension to load.
     */
    loadExtension(extension: IExtension): void {
        const extensionId = extension.getId();
        if (this.loadedExtensions.has(extensionId)) {
            throw new Error(`Extension with id ${extensionId} already exists.`);
        }

        this.loadedExtensions.set(extensionId, extension);
    }

    /**
     * Check whether the extension has been loaded.
     * @param extensionId Extension ID.
     * @returns True if the extension is loaded.
     */
    isExtensionLoaded(extensionId: string): boolean {
        return this.loadedExtensions.has(extensionId);
    }

    /**
     * Enable the extension with given ID.
     * @throws Will throw an error if extension is not found or has been enabled.
     * @param extensionId ID of the extension to enable.
     */
    enableExtension(extensionId: string): void {
        const extension = this.getExtensionById(extensionId);
        if (!extension) {
            throw new Error(`Extension ${extensionId} is not found.`);
        }

        if (extension.isEnabled()) {
            throw new Error(`Extension ${extensionId} is already enabled.`);
        }

        // @TODO
    }

    /**
     * Disable the extension with given ID.
     * @throws Will throw an error if extension is not found or not enabled.
     * @param extensionId ID of the extension to disable.
     */
    disableExtension(extensionId: string): void {
        const extension = this.getExtensionById(extensionId);
        if (!extension) {
            throw new Error(`Extension ${extensionId} is not found.`);
        }

        if (!extension.isEnabled()) {
            throw new Error(`Extension ${extensionId} is not enabled.`);
        }

        // @TODO
    }

    /**
     * Check whether the extension is enabled.
     * @param extensionId ID of the extension to check.
     * @returns True if the extension is enabled.
     */
    isExtensionEnabled(extensionId: string): boolean {
        const extension = this.getExtensionById(extensionId);
        return !!extension && extension.isEnabled();
    }

    /**
     * Get the extension object.
     * @param extensionId ID of the extension.
     * @returns The extension object.
     */
    protected getExtensionById(extensionId: string): IExtension | null {
        return this.loadedExtensions.get(extensionId) ?? null;
    }

    /**
     * Add an event listener.
     * @param event Name of the event.
     * @param listener Callback function.
     */
    addEventListener(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.addListener(event, listener);
    }

    /**
     * Remove an event listener.
     * @param event Name of the event.
     * @param listener Callback function.
     */
    removeEventListener(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.removeListener(event, listener);
    }
}
