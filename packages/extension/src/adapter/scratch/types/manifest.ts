/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * All metadata needed for extension to be shown in gui.
 */
interface ExtensionManifest {
    name: string;
    extensionId: string;
    collaborator?: string;
    iconURL: string;
    insetIconURL: string;
    description: string;
    featured: boolean;
    disabled?: boolean;
    bluetoothRequired?: boolean;
    internetConnectionRequired?: boolean;
    launchPeripheralConnectionFlow?: boolean;
    useAutoScan?: boolean;
    connectionIconURL?: string;
    connectionSmallIconURL?: string;
    connectionTipIconURL?: string;
    connectingMessage?: string;
    helpLink?: string;
}

export default ExtensionManifest;
