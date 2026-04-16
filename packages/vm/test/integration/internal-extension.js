const test = require('tap').test;
const {ExtensionManager, ScratchBuiltinAdapter} = require('clipcc-extension');

const BlockType = require('../../src/extension-support/block-type');

const VirtualMachine = require('../../src/virtual-machine');

const Sprite = require('../../src/sprites/sprite');
const RenderedTarget = require('../../src/sprites/rendered-target');

class TestInternalExtension {
    constructor () {
        this.status = {};
        this.status.constructorCalled = true;
    }

    getInfo () {
        this.status.getInfoCalled = true;
        return {
            id: 'testInternalExtension',
            name: 'Test Internal Extension',
            blocks: [
                {
                    opcode: 'go'
                }
            ],
            menus: {
                simpleMenu: this._buildAMenu(),
                dynamicMenu: '_buildDynamicMenu'
            }
        };
    }

    go (args, util, blockInfo) {
        this.status.goCalled = true;
        return blockInfo;
    }

    _buildAMenu () {
        this.status.buildMenuCalled = true;
        return ['abcd', 'efgh', 'ijkl'];
    }

    _buildDynamicMenu () {
        this.status.buildDynamicMenuCalled = true;
        return [1, 2, 3, 4, 6];
    }
}

test('internal extension', async t => {
    const vm = new VirtualMachine();
    vm.attachExtensionManager(new ExtensionManager(), []);

    const extensionAdapter = new ScratchBuiltinAdapter({
        extensionId: 'testInternalExtension',
        name: 'Test Internal Extension'
    }, () => TestInternalExtension, vm.runtime);
    vm.extensionManager.loadExtension(extensionAdapter);

    t.notOk(extensionAdapter.instance);
    await vm.extensionManager.enableExtension('testInternalExtension');
    const extension = extensionAdapter.instance;
    t.ok(extension);
    t.ok(extension.status.getInfoCalled);

    const func = vm.runtime.getOpcodeFunction('testInternalExtension_go');
    t.type(func, 'function');

    t.notOk(extension.status.goCalled);
    const goBlockInfo = func();
    t.ok(extension.status.goCalled);

    // The 'go' block returns its own blockInfo. Make sure it matches the expected info.
    // Note that the extension parser fills in missing fields so there are more fields here than in `getInfo`.
    const expectedBlockInfo = {
        arguments: {},
        blockAllThreads: false,
        blockType: BlockType.COMMAND,
        func: goBlockInfo.func, // Cheat since we don't have a good way to ensure we generate the same function
        opcode: 'go',
        terminal: false,
        text: 'go'
    };
    t.same(goBlockInfo, expectedBlockInfo);

    const info = extensionAdapter.cachedCategoryInfo;

    // There should be 2 menus - one is an array, one is the function to call.
    t.equal(info.menus.length, 2);
    // First menu has 3 items.
    t.equal(info.menus[0].json.args0[0].options.length, 3);
    // Second menu is a dynamic menu and therefore should be a function.
    t.type(info.menus[1].json.args0[0].options, 'function');

    t.end();
});

test('load coreExample', async t => {
    const vm = new VirtualMachine();
    vm.attachExtensionManager(new ExtensionManager(), [{
        extensionId: 'coreExample',
        name: 'CoreEx'
    }]);
    t.ok(vm.extensionManager.isExtensionLoaded('coreExample'));

    await vm.extensionManager.enableExtension('coreExample');
    vm.extensionManager.isExtensionEnabled('coreExample');

    const info = vm.extensionManager.getExtensionById('coreExample').cachedCategoryInfo;
    t.ok(info);

    // blocks should be an array of two items: a button pseudo-block and a reporter block.
    t.equal(info.blocks.length, 3);
    t.type(info.blocks[0].info, 'object');
    t.type(info.blocks[0].info.func, 'MAKE_A_VARIABLE');
    t.equal(info.blocks[0].info.blockType, 'button');
    t.type(info.blocks[1].info, 'object');
    t.equal(info.blocks[1].info.opcode, 'exampleOpcode');
    t.equal(info.blocks[1].info.blockType, 'reporter');
    t.type(info.blocks[2].info, 'object');
    t.equal(info.blocks[2].info.opcode, 'exampleWithInlineImage');
    t.equal(info.blocks[2].info.blockType, 'command');

    // Test the opcode function
    t.equal(info.blocks[1].info.func(), 'no stage yet');

    const sprite = new Sprite(null, vm.runtime);
    sprite.name = 'Stage';
    const stage = new RenderedTarget(sprite, vm.runtime);
    stage.isStage = true;
    vm.runtime.targets = [stage];

    t.equal(info.blocks[1].info.func(), 'Stage');

    t.end();
});
