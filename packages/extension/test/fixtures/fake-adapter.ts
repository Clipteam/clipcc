/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

import type {ExtensionManager} from '../../src/extension-manager';
import type ExtensionManifest from '../../src/interfaces/extension-manifest';
import type {IExtension} from '../../src/interfaces/i_extension';

export class FakeAdapter implements IExtension {
    protected manager: ExtensionManager | null = null;
    protected enabled: boolean = false;

    constructor(
        protected manifest: ExtensionManifest
    ) {}

    attachManager(manager: ExtensionManager): void {
        this.manager = manager;
    }

    getId(): string {
        return this.manifest.extensionId;
    }

    getManifest(): ExtensionManifest {
        return this.manifest;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    enable(): Promise<void> {
        this.enabled = true;
        return Promise.resolve();
    }

    disable(): Promise<void> {
        this.enabled = false;
        return Promise.resolve();
    }

    refreshInfo(): Promise<void> {
        return Promise.resolve();
    }

    getToolboxContents(isStage: boolean) {
        return {
            id: this.getId(),
            xml: ''
        };
    }
}
