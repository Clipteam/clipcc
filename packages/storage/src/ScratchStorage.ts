import log from './log';

import BuiltinHelper from './BuiltinHelper';
import WebHelper, {UrlFunction} from './WebHelper';

import Asset, {AssetData, AssetId} from './Asset';
import {AssetType, type IAssetType} from './AssetType';
import {DataFormat} from './DataFormat';
import scratchFetch from './scratchFetch';
import Helper from './Helper';

interface HelperWithPriority {
    helper: Helper,
    priority: number
}

export class ScratchStorage {
    public defaultAssetId: Record<IAssetType['name'], AssetId>;
    public builtinHelper: BuiltinHelper;
    public webHelper: WebHelper;

    private _helpers: HelperWithPriority[];

    constructor () {
        this.defaultAssetId = {};

        this.builtinHelper = new BuiltinHelper(this);
        this.webHelper = new WebHelper(this);
        this.builtinHelper.registerDefaultAssets();

        this._helpers = [
            {
                helper: this.builtinHelper,
                priority: 100
            },
            {
                helper: this.webHelper,
                priority: -100
            }
        ];
    }

    /**
     * get the `Asset` class constructor.
     */
    get Asset () {
        return Asset;
    }

    /**
     * get the list of supported asset types.
     */
    get AssetType () {
        return AssetType;
    }

    /**
     * returns the list of supported data formats.
     */
    get DataFormat () {
        return DataFormat;
    }

    /**
     * Access the `scratchFetch` module within this library.
     * @returns the scratchFetch module, with properties for `scratchFetch`, `setMetadata`, etc.
     */
    get scratchFetch () {
        return scratchFetch;
    }

    /**
     * returns the `Asset` class constructor
     * @deprecated Please use the `Asset` member of a storage instance instead.
     * @returns the `Asset` class constructor.
     */
    static get Asset () {
        return Asset;
    }

    /**
     * returns the `AssetType` class constructor
     * @deprecated Please use the `AssetType` member of a storage instance instead.
     * @returns - the list of supported asset types.
     */
    static get AssetType () {
        return AssetType;
    }

    /**
     * Add a storage helper to this manager. Helpers with a higher priority number will be checked first when loading
     * or storing assets. For comparison, the helper for built-in assets has `priority=100` and the default web helper
     * has `priority=-100`. The relative order of helpers with equal priorities is undefined.
     * @param helper - the helper to be added.
     * @param priority the priority for this new helper (default: 0).
     */
    addHelper (helper: Helper, priority: number = 0) {
        this._helpers.push({helper, priority});
        this._helpers.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Synchronously fetch a cached asset from built-in storage. Assets are cached when they are loaded.
     * @param assetId - The id of the asset to fetch.
     * @returns The asset, if it exists.
     */
    get (assetId: AssetId): Asset | null {
        return this.builtinHelper.get(assetId);
    }

    /**
     * Deprecated API for caching built-in assets. Use createAsset.
     * @param assetType - The type of the asset to cache.
     * @param dataFormat - The dataFormat of the data for the cached asset.
     * @param data - The data for the cached asset.
     * @param id - The id for the cached asset.
     * @returns The calculated id of the cached asset, or the supplied id if the asset is mutable.
     */
    cache (assetType: IAssetType, dataFormat: DataFormat, data: AssetData, id: AssetId): AssetId {
        log.warn('Deprecation: Storage.cache is deprecated. Use Storage.createAsset, and store assets externally.');
        return this.builtinHelper._store(assetType, dataFormat, data, id);
    }

    /**
     * Construct an Asset, and optionally generate an md5 hash of its data to create an id
     * @param assetType - The type of the asset to cache.
     * @param dataFormat - The dataFormat of the data for the cached asset.
     * @param data - The data for the cached asset.
     * @param id - The id for the cached asset.
     * @param generateId - flag to set id to an md5 hash of data if `id` isn't supplied
     * @returns generated Asset with `id` attribute set if not supplied
     */
    createAsset (
        assetType: IAssetType,
        dataFormat: DataFormat,
        data: AssetData,
        id?: AssetId | null,
        generateId?: boolean
    ): Asset {
        if (!dataFormat) throw new Error('Tried to create asset without a dataFormat');
        return new Asset(assetType, id, dataFormat, data, generateId);
    }

    /**
     * Register a web-based source for assets. Sources will be checked in order of registration.
     * @param types - The types of asset provided by this source.
     * @param getFunction - A function which computes a GET URL from an Asset.
     * @param createFunction - A function which computes a POST URL for asset data.
     * @param updateFunction - A function which computes a PUT URL for asset data.
     */
    addWebStore (
        types: IAssetType[],
        getFunction: UrlFunction,
        createFunction?: UrlFunction,
        updateFunction?: UrlFunction
    ): void {
        this.webHelper.addStore(types, getFunction, createFunction, updateFunction);
    }

    /**
     * Register a web-based source for assets. Sources will be checked in order of registration.
     * @deprecated Please use addWebStore
     * @param types - The types of asset provided by this source.
     * @param urlFunction - A function which computes a GET URL from an Asset.
     */
    addWebSource (types: IAssetType[], urlFunction: UrlFunction): void {
        log.warn('Deprecation: Storage.addWebSource has been replaced by addWebStore.');
        this.addWebStore(types, urlFunction);
    }

    /**
     * TODO: Should this be removed in favor of requesting an asset with `null` as the ID?
     * @param type - Get the default ID for assets of this type.
     * @returns The ID of the default asset of the given type, if any.
     */
    getDefaultAssetId (type: IAssetType): AssetId | undefined {
        if (Object.prototype.hasOwnProperty.call(this.defaultAssetId, type.name)) {
            return this.defaultAssetId[type.name];
        }
    }

    /**
     * Set the default ID for a particular type of asset. This default asset will be used if a requested asset cannot
     * be found and automatic fallback is enabled. Ideally this should be an asset that is available locally or even
     * one built into this module.
     * TODO: Should this be removed in favor of requesting an asset with `null` as the ID?
     * @param type - The type of asset for which the default will be set.
     * @param id - The default ID to use for this type of asset.
     */
    setDefaultAssetId (type: IAssetType, id: AssetId): void {
        this.defaultAssetId[type.name] = id;
    }

    /**
     * Fetch an asset by type & ID.
     * @param assetType - The type of asset to fetch. This also determines which asset store to use.
     * @param assetId - The ID of the asset to fetch: a project ID, MD5, etc.
     * @param dataFormat - Optional: load this format instead of the AssetType's default.
     * @returns A promise for the requested Asset.
     *   If the promise is resolved with non-null, the value is the requested asset.
     *   If the promise is resolved with null, the desired asset could not be found with the current asset sources.
     *   If the promise is rejected, there was an error on at least one asset source. HTTP 404 does not count as an
     *   error here, but (for example) HTTP 403 does.
     */
    load (assetType: IAssetType, assetId: AssetId, dataFormat?: DataFormat): Promise<Asset | null> {
        const helpers = this._helpers.map(x => x.helper);
        const errors: unknown[] = [];
        dataFormat = dataFormat || assetType.runtimeFormat;

        let helperIndex = 0;
        let helper: Helper;
        const tryNextHelper = (err?: unknown): Promise<Asset | null> => {
            if (err) { // Track the error, but continue looking
                errors.push(err);
            }

            helper = helpers[helperIndex++];

            if (helper) {
                const loading = helper.load(assetType, assetId, dataFormat);
                if (loading === null) {
                    return tryNextHelper();
                }
                // Note that other attempts may have logged errors; if this succeeds they will be suppressed.
                return loading
                    // TODO: maybe some types of error should prevent trying the next helper?
                    .catch(tryNextHelper);
            } else if (errors.length > 0) {
                // We looked through all the helpers and couldn't find the asset, AND
                // at least one thing went wrong while we were looking.
                return Promise.reject(errors);
            }

            // Nothing went wrong but we couldn't find the asset.
            return Promise.resolve(null);
        };

        return tryNextHelper();
    }

    /**
     * Store an asset by type & ID.
     * @param assetType - The type of asset to fetch. This also determines which asset store to use.
     * @param dataFormat - Optional: load this format instead of the AssetType's default.
     * @param data - Data to store for the asset
     * @param assetId - The ID of the asset to fetch: a project ID, MD5, etc.
     * @returns A promise for asset metadata
     */
    store (assetType: IAssetType, dataFormat = assetType.runtimeFormat, data: AssetData, assetId?: AssetId) {
        return this.webHelper.store(assetType, dataFormat, data, assetId)
            .then(body => {
                // The previous logic here ignored that the body can be a string (if it's not a JSON),
                // so just ignore that case.
                // Also, having undefined was the previous behavior
                const id = typeof body === 'string' ? undefined : body.id;

                this.builtinHelper._store(assetType, dataFormat, data, id);
                return body;
            });
    }
}
