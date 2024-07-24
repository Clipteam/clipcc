import ScratchStorage from 'clipcc-storage';

import defaultProject from './default-project';

/**
 * Wrapper for ScratchStorage which adds default web sources.
 * @todo make this more configurable
 */
class Storage extends ScratchStorage {
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
    setAuthorizationToken (token) {
        this.authorizationToken = `Bearer ${token}`;
    }
    setProjectHost (projectHost) {
        this.projectHost = projectHost;
    }
    setProjectToken (projectToken) {
        this.projectToken = projectToken;
    }
    getProjectGetConfig (projectAsset) {
        const [projectState, projectId] = projectAsset.assetId.split('|');
        switch (projectState) {
        case 'public':
            return `${this.projectHost}project/json/${projectId}.json`;
        default:
            return {
                url: `${this.projectHost}project/privateJson?id=${projectId}&t=${Date.now()}`,
                withCredentials: true,
                headers: {
                    authorization: this.authorizationToken
                }
            };
        }
    }
    getProjectCreateConfig () {
        return {
            url: `${this.projectHost}project/create`,
            withCredentials: true,
            headers: {
                authorization: this.authorizationToken
            }
        };
    }
    getProjectUpdateConfig (projectAsset) {
        return {
            url: `${this.projectHost}project/json/${projectAsset.assetId}`,
            withCredentials: true,
            headers: {
                authorization: this.authorizationToken
            }
        };
    }
    setAssetHost (assetHost) {
        this.assetHost = assetHost;
    }
    setCdnHost (cdnHost) {
        this.cdnHost = cdnHost;
    }
    getAssetGetConfig (asset) {
        return {
            url: `${this.cdnHost}project/asset/${asset.assetId}.${asset.dataFormat}`,
            headers: {
                referer: location.host
            }
        };
    }
    getAssetCreateConfig (asset) {
        return {
            // There is no such thing as updating assets, but storage assumes it
            // should update if there is an assetId, and the asset store uses the
            // assetId as part of the create URI. So, force the method to POST.
            // Then when storage finds this config to use for the "update", still POSTs
            method: 'post',
            url: `${this.assetHost}uploadAsset/${asset.assetId}.${asset.dataFormat}`,
            headers: {
                authorization: this.authorizationToken
            }
        };
    }
    setTranslatorFunction (translator) {
        this.translator = translator;
        this.cacheDefaultProject();
    }
    cacheDefaultProject () {
        const defaultProjectAssets = defaultProject(this.translator);
        defaultProjectAssets.forEach(asset => this.builtinHelper._store(
            this.AssetType[asset.assetType],
            this.DataFormat[asset.dataFormat],
            asset.data,
            asset.id
        ));
    }
}

const storage = new Storage();

export default storage;
