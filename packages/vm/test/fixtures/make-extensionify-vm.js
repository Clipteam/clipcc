const VirtualMachine = require('../../src/index');
const {ExtensionManager} = require('clipcc-extension');

class ExtensionifyVM extends VirtualMachine {
    constructor (...props) {
        super(...props);
        const extManager = new ExtensionManager();
        extManager.attachVM(this);
        this.attachExtensionManager(extManager);
    }
}

module.exports = ExtensionifyVM;
