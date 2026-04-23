const {ExtensionManager} = require('clipcc-extension');

const extensionManifest = [
    {
        name: 'Music',
        extensionId: 'music'
    },
    {
        name: 'Pen',
        extensionId: 'pen'
    },
    {
        name: 'Video Sensing',
        extensionId: 'videoSensing'
    },
    {
        name: 'Text to Speech',
        extensionId: 'text2speech'
    },
    {
        name: 'Translate',
        extensionId: 'translate'
    },
    {
        name: 'Makey Makey',
        extensionId: 'makeymakey'
    },
    {
        name: 'micro:bit',
        extensionId: 'microbit'
    },
    {
        name: 'LEGO MINDSTORMS EV3',
        extensionId: 'ev3'
    },
    {
        name: 'LEGO BOOST',
        extensionId: 'boost'
    },
    {
        name: 'LEGO Education WeDo 2.0',
        extensionId: 'wedo2'
    },
    {
        name: 'Go Direct Force & Acceleration',
        extensionId: 'gdxfor'
    }
];

module.exports = function (vm) {
    vm.attachExtensionManager(new ExtensionManager(), extensionManifest);
};
