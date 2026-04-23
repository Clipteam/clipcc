## clipcc-storage
#### ClipCC Storage is a library for loading and storing project and asset files for ClipCC

## Installation
This requires you to have Node.js installed.

In your own Node.js environment/application:
```bash
npm install https://github.com/LLK/clipcc-storage.git
```

> you may need to follow root [contribution guide](../../CONTRIBUTING.md) to set up the development environment first.

If you want to edit/play yourself (requires Git):
```bash
# In project root
cd packages/storage
pnpm build
```

## Using clipcc-storage

### From HTML

```html
<script src="clipcc-storage/dist/web/scratch-storage.js"></script>
<script>
    var storage = new Scratch.Storage();
    // continue to "Storage API Quick Start" section below
</script>
```

### From Node.js / Webpack

```js
var storage = require('clipcc-storage');
// continue to "Storage API Quick Start" section below
```

### Storage API Quick Start

Once you have an instance of `clipcc-storage`, add some web sources. For each source you'll need to provide a function
to generate a URL for a supported type of asset:
```js
/**
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project asset (PNG, WAV, etc.)
 */
var getAssetUrl = function (asset) {
    var assetUrlParts = [
        'https://assets.example.com/path/to/assets/',
        asset.assetId,
        '.',
        asset.dataFormat,
        '/get/'
    ];
    return assetUrlParts.join('');
};
```

Then, let the storage module know about your source:
```js
storage.addWebStore(
    [AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound],
    getAssetUrl);
```

If you're using ES6 you may be able to simplify all of the above quite a bit:
```js
storage.addWebStore(
    [AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound],
    asset => `https://assets.example.com/path/to/assets/${asset.assetId}.${asset.dataFormat}/get/`);
```

Once the storage module is aware of the sources you need, you can start loading assets:
```js
storage.load(AssetType.Sound, soundId).then(function (soundAsset) {
    // `soundAsset` is an `Asset` object. File contents are stored in `soundAsset.data`.
});
```

If you'd like to use `clipcc-storage` with `clipcc-vm` you must "attach" the storage module to the VM:
```js
vm.attachStorage(storage);
```

## Testing

To run all tests:
```bash
npm test
```

To show test coverage:
```bash
npm run coverage
```
