import {DataFormat, type IDataFormat} from './DataFormat';

export interface IAssetType {
    contentType: string,
    name: string,
    runtimeFormat: IDataFormat,
    immutable: boolean
}

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

export type BuiltinAssetType = (typeof AssetType)[keyof typeof AssetType];
export type BuiltinAssetTypeContentType = BuiltinAssetType['contentType'];
