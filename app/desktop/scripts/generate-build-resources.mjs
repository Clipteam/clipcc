import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import png2icons from 'png2icons';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const desktopRoot = path.resolve(__dirname, '..');
const sourceIconDir = path.resolve(desktopRoot, 'src/common/icon');
const buildResourcesDir = path.resolve(desktopRoot, 'buildResources');

const appSourceSvg = path.resolve(sourceIconDir, 'app.svg');

const appIcoPath = path.resolve(buildResourcesDir, 'app.ico');
const appIcnsPath = path.resolve(buildResourcesDir, 'app.icns');

const appxLogoSizes = [
    {name: 'Square44x44Logo.png', width: 44, height: 44},
    {name: 'StoreLogo.png', width: 50, height: 50},
    {name: 'Square150x150Logo.png', width: 150, height: 150},
    {name: 'Wide310x150Logo.png', width: 310, height: 150}
];

/**
 * Render an SVG source to PNG.
 * @param {string} sourcePath Source SVG path.
 * @param {number} width Target width.
 * @param {number} height Target height.
 * @returns {Promise<Buffer>} PNG bytes.
 */
const renderPng = (sourcePath, width, height) => sharp(sourcePath)
    .resize(width, height, {
        fit: 'contain',
        background: {r: 0, g: 0, b: 0, alpha: 0}
    })
    .png()
    .toBuffer();

/**
 * Assert non-empty icon data from png2icons.
 * @param {Uint8Array | Buffer | false} iconBuffer Output buffer from png2icons.
 * @param {string} label Icon label for error text.
 * @returns {Buffer} Normalized Node buffer.
 */
const requireIconBuffer = (iconBuffer, label) => {
    if (!iconBuffer || iconBuffer.length === 0) {
        throw new Error(`Failed to generate ${label}`);
    }
    return Buffer.from(iconBuffer);
};

const generate = async () => {
    await mkdir(path.resolve(buildResourcesDir, 'appx'), {recursive: true});
    await mkdir(path.resolve(buildResourcesDir, 'icon'), {recursive: true});

    const appMasterPng = await renderPng(appSourceSvg, 1024, 1024);

    const appIcoData = requireIconBuffer(
        png2icons.createICO(appMasterPng, png2icons.BILINEAR, 0, true),
        'app.ico'
    );
    const appIcnsData = requireIconBuffer(
        png2icons.createICNS(appMasterPng, png2icons.BILINEAR, 0),
        'app.icns'
    );

    await Promise.all([
        writeFile(appIcoPath, appIcoData),
        writeFile(appIcnsPath, appIcnsData)
    ]);

    await Promise.all(appxLogoSizes.map(async logo => {
        const outputPath = path.resolve(buildResourcesDir, 'appx', logo.name);
        const png = await renderPng(appSourceSvg, logo.width, logo.height);
        await writeFile(outputPath, png);
    }));
};

generate();
