import {DataFormat, IDataFormat} from './DataFormat';

export interface IAssetType {
    contentType: string,
    name: string,
    runtimeFormat: IDataFormat,
    immutable: boolean
}

/**
 * Enumeration of the supported asset types.
 */
export const AssetType = {
    ImageBitmap: {
        contentType: 'image/png',
        name: 'ImageBitmap',
        runtimeFormat: DataFormat.PNG,
        immutable: true
    },
    ImageVector: {
        contentType: 'image/svg+xml',
        name: 'ImageVector',
        runtimeFormat: DataFormat.SVG,
        immutable: true
    },
    Project: {
        contentType: 'application/json',
        name: 'Project',
        runtimeFormat: DataFormat.JSON,
        immutable: false
    },
    Sound: {
        contentType: 'audio/x-wav',
        name: 'Sound',
        runtimeFormat: DataFormat.WAV,
        immutable: true
    },
    Sprite: {
        contentType: 'application/json',
        name: 'Sprite',
        runtimeFormat: DataFormat.JSON,
        immutable: true
    }
} as const;
