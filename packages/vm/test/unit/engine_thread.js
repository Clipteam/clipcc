const Thread = require('../../src/engine/thread');
const RenderedTarget = require('../../src/sprites/rendered-target');
const Sprite = require('../../src/sprites/sprite');
const Runtime = require('../../src/engine/runtime');

test('spec', () => {
    expect(typeof Thread).toBe('function');

    const th = new Thread('arbitraryString');
    expect(typeof th).toBe('object');
    expect(th instanceof Thread).toBeTruthy();
    expect(typeof th.pushStack).toBe('function');
    expect(typeof th.reuseStackForNextBlock).toBe('function');
    expect(typeof th.popStack).toBe('function');
    expect(typeof th.stopThisScript).toBe('function');
    expect(typeof th.peekStack).toBe('function');
    expect(typeof th.peekStackFrame).toBe('function');
    expect(typeof th.peekParentStackFrame).toBe('function');
    expect(typeof th.pushReportedValue).toBe('function');
    expect(typeof th.initParams).toBe('function');
    expect(typeof th.pushParam).toBe('function');
    expect(typeof th.peekStack).toBe('function');
    expect(typeof th.getParam).toBe('function');
    expect(typeof th.atStackTop).toBe('function');
    expect(typeof th.goToNextBlock).toBe('function');
    expect(typeof th.isRecursiveCall).toBe('function');
});

test('pushStack', () => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
});

test('popStack', () => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    expect(th.popStack()).toBe('arbitraryString');
    expect(th.popStack()).toBe(undefined);
});

test('atStackTop', () => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.pushStack('secondString');
    expect(th.atStackTop()).toBe(false);
    th.popStack();
    expect(th.atStackTop()).toBe(true);
});

test('reuseStackForNextBlock', () => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.reuseStackForNextBlock('secondString');
    expect(th.popStack()).toBe('secondString');
});

test('peekStackFrame', () => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    expect(th.peekStackFrame().warpMode).toBe(false);
    th.popStack();
    expect(th.peekStackFrame()).toBe(null);
});

test('peekParentStackFrame', () => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.peekStackFrame().warpMode = true;
    expect(th.peekParentStackFrame()).toBe(null);
    th.pushStack('secondString');
    expect(th.peekParentStackFrame().warpMode).toBe(true);
});

test('pushReportedValue', () => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.pushStack('secondString');
    th.pushReportedValue('value');
    expect(th.justReported).toBe('value');
});

test('peekStack', () => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    expect(th.peekStack()).toBe('arbitraryString');
    th.popStack();
    expect(th.peekStack()).toBe(null);
});

test('PushGetParam', () => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.initParams();
    th.pushParam('testParam', 'testValue');
    expect(th.peekStackFrame().params.testParam).toBe('testValue');
    expect(th.getParam('testParam')).toBe('testValue');
    // Params outside of define stack always evaluate to null
    expect(th.getParam('nonExistentParam')).toBe(null);
});

test('goToNextBlock', () => {
    const th = new Thread('arbitraryString');
    const r = new Runtime();
    const s = new Sprite(null, r);
    const rt = new RenderedTarget(s, r);
    const block1 = {fields: Object,
        id: 'arbitraryString',
        inputs: Object,
        STEPS: Object,
        block: 'fakeBlock',
        name: 'STEPS',
        next: 'secondString',
        opcode: 'motion_movesteps',
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };
    const block2 = {fields: Object,
        id: 'secondString',
        inputs: Object,
        STEPS: Object,
        block: 'fakeBlock',
        name: 'STEPS',
        next: null,
        opcode: 'procedures_call',
        mutation: {proccode: 'fakeCode'},
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };

    rt.blocks.createBlock(block1);
    rt.blocks.createBlock(block2);
    rt.blocks.createBlock(block2);
    th.target = rt;

    expect(th.peekStack()).toBe(null);
    th.pushStack('secondString');
    expect(th.peekStack()).toBe('secondString');
    th.goToNextBlock();
    expect(th.peekStack()).toBe(null);
    th.pushStack('secondString');
    th.pushStack('arbitraryString');
    expect(th.peekStack()).toBe('arbitraryString');
    th.goToNextBlock();
    expect(th.peekStack()).toBe('secondString');
    th.goToNextBlock();
    expect(th.peekStack()).toBe(null);
});

test('stopThisScript', () => {
    const th = new Thread('arbitraryString');
    const r = new Runtime();
    const s = new Sprite(null, r);
    const rt = new RenderedTarget(s, r);
    const block1 = {fields: Object,
        id: 'arbitraryString',
        inputs: Object,
        STEPS: Object,
        block: 'fakeBlock',
        name: 'STEPS',
        next: null,
        opcode: 'motion_movesteps',
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };
    const block2 = {fields: Object,
        id: 'secondString',
        inputs: Object,
        STEPS: Object,
        block: 'fakeBlock',
        name: 'STEPS',
        next: null,
        opcode: 'procedures_call',
        mutation: {proccode: 'fakeCode'},
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };

    rt.blocks.createBlock(block1);
    rt.blocks.createBlock(block2);
    th.target = rt;

    th.stopThisScript();
    expect(th.peekStack()).toBe(null);
    th.pushStack('arbitraryString');
    expect(th.peekStack()).toBe('arbitraryString');
    th.stopThisScript();
    expect(th.peekStack()).toBe(null);
    th.pushStack('arbitraryString');
    th.pushStack('secondString');
    th.stopThisScript();
    expect(th.peekStack()).toBe('secondString');
});

test('isRecursiveCall', () => {
    const th = new Thread('arbitraryString');
    const r = new Runtime();
    const s = new Sprite(null, r);
    const rt = new RenderedTarget(s, r);
    const block1 = {fields: Object,
        id: 'arbitraryString',
        inputs: Object,
        STEPS: Object,
        block: 'fakeBlock',
        name: 'STEPS',
        next: null,
        opcode: 'motion_movesteps',
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };
    const block2 = {fields: Object,
        id: 'secondString',
        inputs: Object,
        STEPS: Object,
        block: 'fakeBlock',
        name: 'STEPS',
        next: null,
        opcode: 'procedures_call',
        mutation: {proccode: 'fakeCode'},
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };

    rt.blocks.createBlock(block1);
    rt.blocks.createBlock(block2);
    th.target = rt;

    expect(th.isRecursiveCall('fakeCode')).toBe(false);
    th.pushStack('secondString');
    expect(th.isRecursiveCall('fakeCode')).toBe(false);
    th.pushStack('arbitraryString');
    expect(th.isRecursiveCall('fakeCode')).toBe(true);
    th.pushStack('arbitraryString');
    expect(th.isRecursiveCall('fakeCode')).toBe(true);
    th.popStack();
    expect(th.isRecursiveCall('fakeCode')).toBe(true);
    th.popStack();
    expect(th.isRecursiveCall('fakeCode')).toBe(false);
    th.popStack();
    expect(th.isRecursiveCall('fakeCode')).toBe(false);
});
