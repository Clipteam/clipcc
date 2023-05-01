const Sequencer = require('../../src/engine/sequencer');
const Runtime = require('../../src/engine/runtime');
const Thread = require('../../src/engine/thread');
const RenderedTarget = require('../../src/sprites/rendered-target');
const Sprite = require('../../src/sprites/sprite');

test('spec', () => {
    expect(typeof Sequencer).toBe('function');

    const r = new Runtime();
    const s = new Sequencer(r);

    expect(typeof s).toBe('object');
    expect(s instanceof Sequencer).toBeTruthy();

    expect(typeof s.stepThreads).toBe('function');
    expect(typeof s.stepThread).toBe('function');
    expect(typeof s.stepToBranch).toBe('function');
    expect(typeof s.stepToProcedure).toBe('function');
    expect(typeof s.retireThread).toBe('function');
});

const randomString = function () {
    const top = Math.random().toString(36);
    return top.substring(7);
};

const generateBlock = function (id) {
    const block = {fields: Object,
        id: id,
        inputs: {},
        STEPS: Object,
        block: 'fakeBlock',
        name: 'fakeName',
        next: null,
        opcode: 'procedures_definition',
        mutation: {proccode: 'fakeCode'},
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };
    return block;
};

const generateBlockInput = function (id, next, inp) {
    const block = {fields: Object,
        id: id,
        inputs: {SUBSTACK: {block: inp, name: 'SUBSTACK'}},
        STEPS: Object,
        block: 'fakeBlock',
        name: 'fakeName',
        next: next,
        opcode: 'procedures_definition',
        mutation: {proccode: 'fakeCode'},
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };
    return block;
};

const generateThread = function (runtime) {
    const s = new Sprite(null, runtime);
    const rt = new RenderedTarget(s, runtime);
    const th = new Thread(randomString());
    
    let next = randomString();
    let inp = randomString();
    let name = th.topBlock;
    
    rt.blocks.createBlock(generateBlockInput(name, next, inp));
    th.pushStack(name);
    rt.blocks.createBlock(generateBlock(inp));
    
    for (let i = 0; i < 10; i++) {
        name = next;
        next = randomString();
        inp = randomString();
        
        rt.blocks.createBlock(generateBlockInput(name, next, inp));
        th.pushStack(name);
        rt.blocks.createBlock(generateBlock(inp));
    }
    rt.blocks.createBlock(generateBlock(next));
    th.pushStack(next);
    th.target = rt;
    th.blockContainer = rt.blocks;

    runtime.threads.push(th);

    return th;
};

test('stepThread', () => {
    const r = new Runtime();
    const s = new Sequencer(r);
    let th = generateThread(r);
    expect(th.status).not.toBe(Thread.STATUS_DONE);
    s.stepThread(th);
    expect(th.status).toBe(Thread.STATUS_DONE);
    th = generateThread(r);
    th.status = Thread.STATUS_YIELD;
    s.stepThread(th);
    expect(th.status).not.toBe(Thread.STATUS_DONE);
    th.status = Thread.STATUS_PROMISE_WAIT;
    s.stepThread(th);
    expect(th.status).not.toBe(Thread.STATUS_DONE);
});

test('stepToBranch', () => {
    const r = new Runtime();
    const s = new Sequencer(r);
    const th = generateThread(r);
    s.stepToBranch(th, 2, false);
    expect(th.peekStack()).toBe(null);
    th.popStack();
    s.stepToBranch(th, 1, false);
    expect(th.peekStack()).toBe(null);
    th.popStack();
    th.popStack();
    s.stepToBranch(th, 1, false);
    expect(th.peekStack()).not.toBe(null);
});

test('retireThread', () => {
    const r = new Runtime();
    const s = new Sequencer(r);
    const th = generateThread(r);
    expect(th.stack.length).toBe(12);
    s.retireThread(th);
    expect(th.stack.length).toBe(0);
    expect(th.status).toBe(Thread.STATUS_DONE);
});

test('stepToProcedure', () => {
    const r = new Runtime();
    const s = new Sequencer(r);
    const th = generateThread(r);
    let expectedBlock = th.peekStack();
    s.stepToProcedure(th, '');
    expect(th.peekStack()).toBe(expectedBlock);
    s.stepToProcedure(th, 'faceCode');
    expect(th.peekStack()).toBe(expectedBlock);

    th.target.blocks.createBlock({
        id: 'internalId',
        opcode: 'procedures_prototype',
        mutation: {
            proccode: 'othercode'
        }
    });
    expectedBlock = th.stack[th.stack.length - 4];
    th.target.blocks.getBlock(expectedBlock).inputs.custom_block = {
        type: 'custom_block',
        block: 'internalId'
    };
    s.stepToProcedure(th, 'othercode');
    expect(th.peekStack()).toBe(expectedBlock);
});

test('stepThreads', () => {
    const r = new Runtime();
    r.currentStepTime = Infinity;
    const s = new Sequencer(r);
    expect(s.stepThreads().length).toBe(0);
    generateThread(r);
    expect(r.threads.length).toBe(1);
    // Threads should be marked DONE and removed in the same step they finish.
    expect(s.stepThreads().length).toBe(1);
});
