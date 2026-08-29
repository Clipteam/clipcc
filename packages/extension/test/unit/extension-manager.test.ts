/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

import {describe, expect, test, beforeAll, jest} from '@jest/globals';
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

    test('Update Locale', async () => {
        const manager = new ExtensionManager();
        const extension = new FakeAdapter(FAKE_MANIFEST);
        manager.loadExtension(extension);
        manager.enableExtension(FAKE_MANIFEST.extensionId);

        const spyRefreshInfo = jest.spyOn(extension, 'refreshInfo');

        // refreshInfo should be called when locale is updated.
        manager.setLocale('zh-cn', {});
        expect(spyRefreshInfo).toHaveBeenCalledTimes(1);

        // refreshInfo won't be called if the extension is disabled.
        manager.disableExtension(FAKE_MANIFEST.extensionId);
        manager.setLocale('en', {});
        expect(spyRefreshInfo).toHaveBeenCalledTimes(1);
    });
});
