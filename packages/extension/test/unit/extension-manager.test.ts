/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

import {describe, expect, test, beforeAll} from '@jest/globals';
import {FakeAdapter} from '../fixtures/fake-adapter';
import type ExtensionManifest from '../../src/interfaces/extension-manifest';
import {ExtensionManager} from '../../src/extension-manager';

const FAKE_MANIFEST: ExtensionManifest = {
    extensionId: 'fake.extension',
    name: 'Fake Extension',
    iconURL: '',
    insetIconURL: '',
    description: '',
    featured: true
};

describe('ExtensionManager', () => {
    test('Load & Enable Extension', async () => {
        const manager = new ExtensionManager();

        const extension = new FakeAdapter(FAKE_MANIFEST);
        const extensionId = extension.getId();
        expect(manager.isExtensionLoaded(extensionId)).toBeFalsy();

        // Load extension.
        manager.loadExtension(extension);
        expect(manager.isExtensionLoaded(extensionId)).toBeTruthy();
        expect(manager.isExtensionEnabled(extensionId)).toBeFalsy();

        // Enable extension.
        await manager.enableExtension(extensionId);
        expect(manager.isExtensionLoaded(extensionId)).toBeTruthy();
        expect(manager.isExtensionEnabled(extensionId)).toBeTruthy();

        // Get manifest.
        expect(manager.getManifest()).toStrictEqual([FAKE_MANIFEST]);

        // Get toolbox contents.
        expect(manager.getToolboxContents(false)).toStrictEqual([{
            id: extensionId,
            xml: ''
        }]);

        // Disable extension.
        await manager.disableExtension(extensionId);
        expect(manager.isExtensionLoaded(extensionId)).toBeTruthy();
        expect(manager.isExtensionEnabled(extensionId)).toBeFalsy();
    });
});
