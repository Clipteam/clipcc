import type Asset from './Asset';
import type {AssetId} from './Asset';
import type {IAssetType} from './AssetType';
import type {DataFormat} from './DataFormat';
import type {ScratchStorage} from './ScratchStorage';

/**
 * Base class for asset load/save helpers.
 */
export default abstract class Helper {
    public parent!: ScratchStorage;

    constructor (parent: ScratchStorage) {
        this.parent = parent;
    }

    /**
     * Fetch an asset but don't process dependencies.
     * @param assetType - The type of asset to fetch.
     * @param assetId - The ID of the asset to fetch: a project ID, MD5, etc.
     * @param dataFormat - The file format / file extension of the asset to fetch: PNG, JPG, etc.
     * @returns A promise for the contents of the asset.
     */
    load (assetType: IAssetType, assetId: AssetId, dataFormat: DataFormat): Promise<Asset | null> | null {
        return Promise.reject(new Error(`No asset of type ${assetType} for ID ${assetId} with format ${dataFormat}`));
    }
}
