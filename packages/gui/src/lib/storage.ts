import {
    ScratchStorage,
    type Asset
} from 'clipcc-storage';
import type {IntlShape} from 'react-intl';

import defaultProject from './default-project';

export type Translator = IntlShape['formatMessage'];

type ConfigResponse = string | {
    url: string;
    withCredentials?: boolean;
    headers?: Record<string, string>;
    method?: 'post';
};

/**
 * Wrapper for ScratchStorage which adds default web sources.
 * @todo make this more configurable
 */
class Storage extends ScratchStorage {
    private projectHost = '';
    private projectToken = '';
    private assetHost = '';
    private cdnHost = '';
    private authorizationToken = '';
    private translator?: Translator;

    constructor () {
        super();
        this.cacheDefaultProject();
    }

    addOfficialScratchWebStores () {
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

    setProjectHost (projectHost: string) {
        this.projectHost = projectHost;
    }

    setProjectToken (projectToken: string) {
        this.projectToken = projectToken;
    }

    getProjectGetConfig (projectAsset: Asset): ConfigResponse {
        const path = `${this.projectHost}project/json/${projectAsset.assetId}`;
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

    setAssetHost (assetHost: string) {
        this.assetHost = assetHost;
    }

    setCdnHost (cdnHost: string): void {
        this.cdnHost = cdnHost;
    }

    setAuthorizationToken (token: string): void {
        this.authorizationToken = `Bearer ${token}`;
    }

    getAssetGetConfig (asset: Asset): ConfigResponse {
        return {
            url: `${this.cdnHost}project/asset/${asset.assetId}.${asset.dataFormat}`,
            headers: {referer: location.host}
        };
    }

    getAssetCreateConfig (asset: Asset): ConfigResponse {
        const headers = this.authorizationToken ? {authorization: this.authorizationToken} : undefined;
        return {
            // There is no such thing as updating assets, but storage assumes it
            // should update if there is an assetId, and the asset store uses the
            // assetId as part of the create URI. So, force the method to POST.
            // Then when storage finds this config to use for the "update", still POSTs
            method: 'post',
            url: `${this.assetHost}project/uploadAsset/${asset.assetId}.${asset.dataFormat}`,
            withCredentials: true,
            headers
        };
    }

    setTranslatorFunction (translator: Translator) {
        this.translator = translator;
        this.cacheDefaultProject();
    }

    cacheDefaultProject () {
        const defaultProjectAssets = defaultProject(this.translator);

        defaultProjectAssets.forEach(asset => {
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
