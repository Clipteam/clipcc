import {md5} from 'js-md5';

import log from './log';

import Asset, {AssetData, AssetId} from './Asset';
import {AssetType, type BuiltinAssetType} from './AssetType';
import {DataFormat, type IDataFormat} from './DataFormat';
import Helper from './Helper';

import defaultImageBitmap from './builtins/defaultBitmap.png?arrayBuffer';
import defaultSound from './builtins/defaultSound.wav?arrayBuffer';
import defaultImageVector from './builtins/defaultVector.svg?arrayBuffer';

import {Buffer} from 'buffer/';
import {ScratchStorage} from './ScratchStorage';

interface BuiltinAssetRecord {
    /** The type of the asset */
    type: BuiltinAssetType,
    /** The format of the asset's data */
    format: IDataFormat,
    /** The asset's unique ID */
    id: AssetId | null,
    /** The asset's data */
    data: AssetData
}

const DefaultAssets: BuiltinAssetRecord[] = [
    {
        type: AssetType.ImageBitmap,
        format: DataFormat.PNG,
        id: null,
        data: Buffer.from(defaultImageBitmap)
    },
    {
        type: AssetType.Sound,
        format: DataFormat.WAV,
        id: null,
        data: Buffer.from(defaultSound)
    },
    {
        type: AssetType.ImageVector,
        format: DataFormat.SVG,
        id: null,
        data: Buffer.from(defaultImageVector)
    }
];

const BuiltinAssets = DefaultAssets.concat([]);

export default class BuiltinHelper extends Helper {
    public assets: Record<string, BuiltinAssetRecord> = {};

    constructor (parent: ScratchStorage) {
        super(parent);

        BuiltinAssets.forEach(assetRecord => {
            assetRecord.id = this._store(assetRecord.type, assetRecord.format, assetRecord.data, assetRecord.id);
        });
    }

    /**
     * Call `setDefaultAssetId` on the parent `ScratchStorage` instance to register all built-in default assets.
     */
    registerDefaultAssets (): void {
        const numAssets = DefaultAssets.length;
        for (let assetIndex = 0; assetIndex < numAssets; ++assetIndex) {
            const assetRecord = DefaultAssets[assetIndex];
            this.parent.setDefaultAssetId(assetRecord.type, assetRecord.id!);
        }
    }


    /**
     * Synchronously fetch a cached asset for a given asset id. Returns null if not found.
     * @param assetId - The id for the asset to fetch.
     * @returns The asset for assetId, if it exists.
     */
    get (assetId: AssetId): Asset | null {
        let asset: Asset | null = null;
        if (Object.prototype.hasOwnProperty.call(this.assets, assetId)) {
            /** @type {BuiltinAssetRecord} */
            const assetRecord = this.assets[assetId];
            asset = new Asset(assetRecord.type, assetRecord.id!, assetRecord.format, assetRecord.data);
        }
        return asset;
    }

    /**
     * Alias for store (old name of store)
     * @deprecated Use BuiltinHelper.store
     * @param assetType - The type of the asset to cache.
     * @param dataFormat - The dataFormat of the data for the cached asset.
     * @param data - The data for the cached asset.
     * @param id - The id for the cached asset.
     * @returns The calculated id of the cached asset, or the supplied id if the asset is mutable.
     */
    cache (assetType: BuiltinAssetType, dataFormat: IDataFormat, data: AssetData, id: AssetId): AssetId {
        log.warn('Deprecation: BuiltinHelper.cache has been replaced with BuiltinHelper.store.');
        return this.store(assetType, dataFormat, data, id);
    }

    /**
     * Deprecated external API for _store
     * @deprecated Not for external use. Create assets and keep track of them outside of the storage instance.
     * @param assetType - The type of the asset to cache.
     * @param dataFormat - The dataFormat of the data for the cached asset.
     * @param data - The data for the cached asset.
     * @param id - The id for the cached asset.
     * @returns The calculated id of the cached asset, or the supplied id if the asset is mutable.
     */
    store (assetType: BuiltinAssetType, dataFormat: IDataFormat, data: AssetData, id: AssetId): AssetId {
        log.warn('Deprecation: use Storage.createAsset. BuiltinHelper is for internal use only.');
        return this._store(assetType, dataFormat, data, id);
    }

    /**
     * Cache an asset for future lookups by ID.
     * @param assetType - The type of the asset to cache.
     * @param dataFormat - The dataFormat of the data for the cached asset.
     * @param data - The data for the cached asset.
     * @param id - The id for the cached asset.
     * @returns The calculated id of the cached asset, or the supplied id if the asset is mutable.
     */
    _store (assetType: BuiltinAssetType, dataFormat: IDataFormat, data: AssetData, id?: AssetId | null): AssetId {
        let assetId = id;
        if (!dataFormat) throw new Error('Data cached without specifying its format');
        if (assetId !== '' && assetId !== null && typeof assetId !== 'undefined') {
            if (Object.prototype.hasOwnProperty.call(this.assets, assetId) && assetType.immutable) return assetId;
        } else if (assetType.immutable) {
            assetId = md5(data);
        } else {
            throw new Error('Tried to cache data without an id');
        }
        this.assets[assetId!] = {
            type: assetType,
            format: dataFormat,
            id: assetId!,
            data: data
        };
        return assetId!;
    }

    /**
     * Fetch an asset but don't process dependencies.
     * @param assetType - The type of asset to fetch.
     * @param assetId - The ID of the asset to fetch: a project ID, MD5, etc.
     * @returns A promise for the contents of the asset.
     */
    load (assetType: BuiltinAssetType, assetId: AssetId): Promise<Asset | null> | null {
        if (!this.get(assetId)) {
            // Return null immediately so Storage can quickly move to trying the
            // next helper.
            return null;
        }
        return Promise.resolve(this.get(assetId));
    }
}
