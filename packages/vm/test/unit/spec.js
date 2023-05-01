const VirtualMachine = require('../../src/index');

test('interface', () => {
    const vm = new VirtualMachine();
    expect(typeof vm).toBe('object');
    expect(typeof vm.start).toBe('function');
    expect(typeof vm.greenFlag).toBe('function');
    expect(typeof vm.setTurboMode).toBe('function');
    expect(typeof vm.setCompatibilityMode).toBe('function');
    expect(typeof vm.stopAll).toBe('function');
    expect(typeof vm.clear).toBe('function');

    expect(typeof vm.getPlaygroundData).toBe('function');
    expect(typeof vm.postIOData).toBe('function');

    expect(typeof vm.loadProject).toBe('function');
    expect(typeof vm.addSprite).toBe('function');
    expect(typeof vm.addCostume).toBe('function');
    expect(typeof vm.addBackdrop).toBe('function');
    expect(typeof vm.addSound).toBe('function');
    expect(typeof vm.deleteCostume).toBe('function');
    expect(typeof vm.deleteSound).toBe('function');
    expect(typeof vm.renameSprite).toBe('function');
    expect(typeof vm.deleteSprite).toBe('function');

    expect(typeof vm.attachRenderer).toBe('function');
    expect(typeof vm.blockListener).toBe('function');
    expect(typeof vm.flyoutBlockListener).toBe('function');
    expect(typeof vm.setEditingTarget).toBe('function');

    expect(typeof vm.emitTargetsUpdate).toBe('function');
    expect(typeof vm.emitWorkspaceUpdate).toBe('function');
    expect(typeof vm.postSpriteInfo).toBe('function');
});
