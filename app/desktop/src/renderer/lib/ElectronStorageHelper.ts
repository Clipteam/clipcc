import type {Asset, BuiltinAssetType, IDataFormat, ScratchStorage} from 'clipcc-storage';

const staticAssets = new URL('./static/assets/', window.location.href);

const basename = (value: string): string => {
    const normalized = value.replace(/\\/g, '/');
    return normalized.split('/').pop() || '';
};

/**
 * Allow the storage module to load files bundled in the Electron application.
 */
class ElectronStorageHelper {
    constructor (
        public parent: ScratchStorage
    ) {}

    /**
     * Fetch an asset but don't process dependencies.
     * @param assetType - The type of asset to fetch.
     * @param assetId - The ID of the asset to fetch: a project ID, MD5, etc.
     * @param dataFormat - The file format / file extension of the asset to fetch: PNG, JPG, etc.
     * @returns A promise for the contents of the asset.
     */
    load (assetType: BuiltinAssetType, assetId: string, dataFormat: IDataFormat): Promise<Asset | null> {
        assetId = basename(assetId);
        dataFormat = basename(dataFormat) as IDataFormat;

        const assetUrl = new URL(`${assetId}.${dataFormat}`, staticAssets);
        return fetch(assetUrl.toString())
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load asset ${assetId}.${dataFormat}: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then(data => new this.parent.Asset(assetType, assetId, dataFormat, new Uint8Array(data)));
    }
}

export default ElectronStorageHelper;
