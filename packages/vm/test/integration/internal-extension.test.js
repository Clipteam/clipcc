const Worker = require('tiny-worker');

const BlockType = require('../../src/extension-support/block-type');

const dispatch = require('../../src/dispatch/central-dispatch');
const VirtualMachine = require('../../src/virtual-machine');

const Sprite = require('../../src/sprites/sprite');
const RenderedTarget = require('../../src/sprites/rendered-target');

// By default Central Dispatch works with the Worker class built into the browser. Tell it to use TinyWorker instead.
dispatch.workerClass = Worker;

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

test('internal extension', () => {
    const vm = new VirtualMachine();

    const extension = new TestInternalExtension();
    expect(extension.status.constructorCalled).toBeTruthy();

    expect(extension.status.getInfoCalled).toBeFalsy();
    vm.extensionManager._registerInternalExtension(extension);
    expect(extension.status.getInfoCalled).toBeTruthy();

    const func = vm.runtime.getOpcodeFunction('testInternalExtension_go');
    expect(typeof func).toBe('function');

    expect(extension.status.goCalled).toBeFalsy();
    const goBlockInfo = func();
    expect(extension.status.goCalled).toBeTruthy();

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
    expect(goBlockInfo).toEqual(expectedBlockInfo);

    // There should be 2 menus - one is an array, one is the function to call.
    expect(vm.runtime._blockInfo[0].menus.length).toBe(2);
    // First menu has 3 items.
    expect(vm.runtime._blockInfo[0].menus[0].json.args0[0].options.length).toBe(3);
    // Second menu is a dynamic menu and therefore should be a function.
    expect(typeof 
        vm.runtime._blockInfo[0].menus[1].json.args0[0].options).toBe('function');
});

test('load sync', () => {
    const vm = new VirtualMachine();
    vm.extensionManager.loadExtensionIdSync('coreExample');
    expect(vm.extensionManager.isExtensionLoaded('coreExample')).toBeTruthy();

    expect(vm.runtime._blockInfo.length).toBe(1);

    // blocks should be an array of two items: a button pseudo-block and a reporter block.
    expect(vm.runtime._blockInfo[0].blocks.length).toBe(3);
    expect(typeof vm.runtime._blockInfo[0].blocks[0].info).toBe('object');
    expect(vm.runtime._blockInfo[0].blocks[0].info.func).toBe('MAKE_A_VARIABLE');
    expect(vm.runtime._blockInfo[0].blocks[0].info.blockType).toBe('button');
    expect(typeof vm.runtime._blockInfo[0].blocks[1].info).toBe('object');
    expect(vm.runtime._blockInfo[0].blocks[1].info.opcode).toBe('exampleOpcode');
    expect(vm.runtime._blockInfo[0].blocks[1].info.blockType).toBe('reporter');
    expect(typeof vm.runtime._blockInfo[0].blocks[2].info).toBe('object');
    expect(vm.runtime._blockInfo[0].blocks[2].info.opcode).toBe('exampleWithInlineImage');
    expect(vm.runtime._blockInfo[0].blocks[2].info.blockType).toBe('command');

    // Test the opcode function
    expect(vm.runtime._blockInfo[0].blocks[1].info.func()).toBe('no stage yet');

    const sprite = new Sprite(null, vm.runtime);
    sprite.name = 'Stage';
    const stage = new RenderedTarget(sprite, vm.runtime);
    stage.isStage = true;
    vm.runtime.targets = [stage];

    expect(vm.runtime._blockInfo[0].blocks[1].info.func()).toBe('Stage');
});
