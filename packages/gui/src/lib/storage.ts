import {
    ScratchStorage,
    type Asset,
    type AssetData,
    type AssetId
} from 'clipcc-storage';

import defaultProject from './default-project';

type Translator = ((messageId: string, defaultMessage?: string, description?: string) => string) | undefined;

type ConfigResponse = string | {
    url: string;
    withCredentials: boolean;
    method?: 'post';
};

interface DefaultProjectAsset {
    id: AssetId;
    assetType: string;
    dataFormat: string;
    data: AssetData;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isDefaultProjectAsset = (value: unknown): value is DefaultProjectAsset => {
    if (!isRecord(value)) return false;
    return typeof value.id !== 'undefined' &&
        typeof value.assetType === 'string' &&
        typeof value.dataFormat === 'string' &&
        typeof value.data !== 'undefined';
};

/**
 * Wrapper for ScratchStorage which adds default web sources.
 * @todo make this more configurable
 */
class Storage extends ScratchStorage {
    projectHost = '';
    private projectToken = '';
    private assetHost = '';
    private translator: Translator;

    constructor () {
        super();
        this.cacheDefaultProject();
    }

    addOfficialScratchWebStores (): void {
        this.addWebStore(
            [this.AssetType.Project],
            this.getProjectGetConfig.bind(this),
            this.getProjectCreateConfig.bind(this),
            this.getProjectUpdateConfig.bind(this)
        );
        this.addWebStore(
            [this.AssetType.ImageVector, this.AssetType.ImageBitmap, this.AssetType.Sound],
            this.getAssetGetConfig.bind(this),
            // We set both the create and update configs to the same method because
            // storage assumes it should update if there is an assetId, but the
            // asset store uses the assetId as part of the create URI.
            this.getAssetCreateConfig.bind(this),
            this.getAssetCreateConfig.bind(this)
        );
        this.addWebStore(
            [this.AssetType.Sound],
            asset => `static/extension-assets/scratch3_music/${asset.assetId}.${asset.dataFormat}`
        );
    }

    setProjectHost (projectHost: string): void {
        this.projectHost = projectHost;
    }

    setProjectToken (projectToken: string): void {
        this.projectToken = projectToken;
    }

    getProjectGetConfig (projectAsset: Asset): ConfigResponse {
        const path = `${this.projectHost}/${projectAsset.assetId}`;
        const qs = this.projectToken ? `?token=${this.projectToken}` : '';
        return path + qs;
    }

    getProjectCreateConfig (): ConfigResponse {
        return {
            url: `${this.projectHost}/`,
            withCredentials: true
        };
    }

    getProjectUpdateConfig (projectAsset: Asset): ConfigResponse {
        return {
            url: `${this.projectHost}/${projectAsset.assetId}`,
            withCredentials: true
        };
    }

    setAssetHost (assetHost: string): void {
        this.assetHost = assetHost;
    }

    getAssetGetConfig (asset: Asset): ConfigResponse {
        return `${this.assetHost}/internalapi/asset/${asset.assetId}.${asset.dataFormat}/get/`;
    }

    getAssetCreateConfig (asset: Asset): ConfigResponse {
        return {
            // There is no such thing as updating assets, but storage assumes it
            // should update if there is an assetId, and the asset store uses the
            // assetId as part of the create URI. So, force the method to POST.
            // Then when storage finds this config to use for the "update", still POSTs
            method: 'post',
            url: `${this.assetHost}/${asset.assetId}.${asset.dataFormat}`,
            withCredentials: true
        };
    }

    setTranslatorFunction (translator: Translator): void {
        this.translator = translator;
        this.cacheDefaultProject();
    }

    cacheDefaultProject (): void {
        const defaultProjectAssets = defaultProject(this.translator);

        defaultProjectAssets.forEach(asset => {
            if (!isDefaultProjectAsset(asset)) {
                return;
            }

            const assetType = this.AssetType[asset.assetType as keyof typeof this.AssetType];
            const dataFormat = this.DataFormat[asset.dataFormat as keyof typeof this.DataFormat];
            if (!assetType || !dataFormat) {
                return;
            }

            this.builtinHelper._store(
                assetType,
                dataFormat,
                asset.data,
                asset.id
            );
        });
    }
}

const storage = new Storage();

export default storage;
