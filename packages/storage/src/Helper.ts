import Asset, {AssetId} from './Asset';
import type {IAssetType} from './AssetType';
import {AcceptedDataFormats} from './DataFormat';
import {ScratchStorage} from './ScratchStorage';

/**
 * Base class for asset load/save helpers.
 * @abstract
 */
export default class Helper {
    public parent!: ScratchStorage;

    constructor (parent: ScratchStorage) {
        this.parent = parent;
    }

    /**
     * Fetch an asset but don't process dependencies.
     * @param assetType - The type of asset to fetch.
     * @param assetId - The ID of the asset to fetch: a project ID, MD5, etc.
     * @param dataFormat - The file format / file extension of the asset to fetch: PNG, JPG, etc.
     * @returns {Promise.<Asset>} A promise for the contents of the asset.
     */
    load (assetType: IAssetType, assetId: AssetId, dataFormat: AcceptedDataFormats): Promise<Asset | null> | null {
        return Promise.reject(new Error(`No asset of type ${assetType} for ID ${assetId} with format ${dataFormat}`));
    }
}
