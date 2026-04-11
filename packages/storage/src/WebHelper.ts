import log from './log';

import Asset, {AssetData, AssetId} from './Asset';
import Helper from './Helper';
import ProxyTool from './ProxyTool';
import {ScratchGetRequest, ScratchSendRequest, Tool} from './Tool';
import type {IAssetType} from './AssetType';
import type {AcceptedDataFormats} from './DataFormat';

const ensureRequestConfig = reqConfig => {
    if (typeof reqConfig === 'string') {
        return {
            url: reqConfig
        };
    }
    return reqConfig;
};

export type UrlFunction = (asset: Asset) => string | ScratchGetRequest | ScratchSendRequest;

interface StoreRecord {
    types: string[],
    get: UrlFunction,
    create?: UrlFunction,
    update?: UrlFunction
}

export default class WebHelper extends Helper {
    public stores: StoreRecord[];
    public assetTool: Tool;
    public projectTool: Tool;

    constructor (parent) {
        super(parent);

        this.stores = [];

        /**
         * Set of tools to best load many assets in parallel. If one tool
         * cannot be used, it will use the next.
         */
        this.assetTool = new ProxyTool();

        /**
         * Set of tools to best load project data in parallel with assets. This
         * tool set prefers tools that are immediately ready. Some tools have
         * to initialize before they can load files.
         */
        this.projectTool = new ProxyTool(ProxyTool.TOOL_FILTER.READY);
    }

    /**
     * Register a web-based source for assets. Sources will be checked in order of registration.
     * @deprecated Please use addStore
     * @param types - The types of asset provided by this source.
     * @param urlFunction - A function which computes a URL from an Asset.
     */
    addSource (types: IAssetType[], urlFunction: UrlFunction): void {
        log.warn('Deprecation: WebHelper.addSource has been replaced with WebHelper.addStore.');
        this.addStore(types, urlFunction);
    }

    /**
     * Register a web-based store for assets. Sources will be checked in order of registration.
     * @param types - The types of asset provided by this store.
     * @param getFunction - A function which computes a GET URL for an Asset
     * @param createFunction - A function which computes a POST URL for an Asset
     * @param updateFunction - A function which computes a PUT URL for an Asset
     */
    addStore (
        types: IAssetType[],
        getFunction: UrlFunction,
        createFunction?: UrlFunction,
        updateFunction?: UrlFunction
    ): void {
        this.stores.push({
            types: types.map(assetType => assetType.name),
            get: getFunction,
            create: createFunction,
            update: updateFunction
        });
    }

    /**
     * Fetch an asset but don't process dependencies.
     * @param assetType - The type of asset to fetch.
     * @param assetId - The ID of the asset to fetch: a project ID, MD5, etc.
     * @param dataFormat - The file format / file extension of the asset to fetch: PNG, JPG, etc.
     * @returns {Promise.<Asset>} A promise for the contents of the asset.
     */
    load (assetType: IAssetType, assetId: AssetId, dataFormat: AcceptedDataFormats): Promise<Asset | null> {

        const errors: unknown[] = [];
        const stores = this.stores.slice()
            .filter(store => store.types.indexOf(assetType.name) >= 0);

        // New empty asset but it doesn't have data yet
        const asset = new Asset(assetType, assetId, dataFormat);

        let tool = this.assetTool;
        if (assetType.name === 'Project') {
            tool = this.projectTool;
        }

        let storeIndex = 0;
        const tryNextSource = (err?: unknown): Promise<Asset | null> => {
            if (err) {
                errors.push(err);
            }
            const store = stores[storeIndex++];

            /** @type {UrlFunction} */
            const reqConfigFunction = store && store.get;

            if (reqConfigFunction) {
                const reqConfig = ensureRequestConfig(reqConfigFunction(asset));
                if (reqConfig === false) {
                    return tryNextSource();
                }

                return tool.get(reqConfig)
                    .then(body => {
                        if (body) {
                            asset.setData(body, dataFormat);
                            return asset;
                        }
                        return tryNextSource();
                    })
                    .catch(tryNextSource);
            } else if (errors.length > 0) {
                return Promise.reject(errors);
            }

            // no stores matching asset
            return Promise.resolve(null);
        };

        return tryNextSource();
    }

    /**
     * Create or update an asset with provided data. The create function is called if no asset id is provided
     * @param assetType - The type of asset to create or update.
     * @param dataFormat - AcceptedDataFormats of the data for the stored asset.
     * @param data - The data for the cached asset.
     * @param assetId - The ID of the asset to fetch: a project ID, MD5, etc.
     * @returns A promise for the response from the create or update request
     */
    store (
        assetType: IAssetType,
        dataFormat: AcceptedDataFormats | undefined,
        data: AssetData,
        assetId?: AssetId
    ): Promise<string | {id: string}> {
        const asset = new Asset(assetType, assetId, dataFormat);
        // If we have an asset id, we should update, otherwise create to get an id
        const create = assetId === '' || assetId === null || typeof assetId === 'undefined';

        // Use the first store with the appropriate asset type and url function
        const store = this.stores.filter(s =>
            // Only use stores for the incoming asset type
            s.types.indexOf(assetType.name) !== -1 && (
                // Only use stores that have a create function if this is a create request
                // or an update function if this is an update request
                (create && s.create) || s.update
            )
        )[0];

        const method = create ? 'post' : 'put';

        if (!store) return Promise.reject(new Error('No appropriate stores'));

        let tool = this.assetTool;
        if (assetType.name === 'Project') {
            tool = this.projectTool;
        }

        const reqConfig = ensureRequestConfig(
            // The non-nullability of this gets checked above while looking up the store.
            // Making TS understand that is going to require code refactoring which we currently don't
            // feel safe to do.
            create ? store.create!(asset) : store.update!(asset)
        );
        const reqBodyConfig = Object.assign({body: data, method}, reqConfig);
        return tool.send(reqBodyConfig)
            .then(body => {
                // xhr makes it difficult to both send FormData and
                // automatically parse a JSON response. So try to parse
                // everything as JSON.
                if (typeof body === 'string') {
                    try {
                        body = JSON.parse(body);
                    } catch {
                        // If it's not parseable, then we can't add the id even
                        // if we want to, so stop here
                        return body;
                    }
                }
                return Object.assign({
                    id: body['content-name'] || assetId
                }, body);
            });
    }
}
