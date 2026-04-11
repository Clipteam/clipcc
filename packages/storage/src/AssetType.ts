import {DataFormat, type AcceptedDataFormats} from './DataFormat';

export interface IAssetType {
    /** the MIME type associated with this kind of data. Useful for data URIs, etc. */
    contentType: string,
    /** The human-readable name of this asset type. */
    name: string,
    /**
     * The default format used for runtime, in-memory storage of this asset. For
     * example, a project stored in SB2 format on disk will be returned as JSON when loaded into memory.
     */
    runtimeFormat: AcceptedDataFormats,
    /** Indicates if the asset id is determined by the asset content. */
    immutable: boolean
}

/**
 * Enumeration of the builtin helper supported asset types.
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
} as const satisfies Record<string, IAssetType>;

/**
 * Builtin helper supported asset types.
 */
export type BuiltinAssetType = (typeof AssetType)[keyof typeof AssetType];
