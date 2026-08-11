import {test} from '../fixtures/jest-tap-bridge.js';
import Procedures from '../../src/blocks/scratch3_procedures';

const blocks = new Procedures(null);

test('getPrimitives', t => {
    t.type(blocks.getPrimitives(), 'object');
    t.end();
});

// Originally inspired by https://github.com/LLK/scratch-gui/issues/809
test('calling a custom block with no definition does not throw', t => {
    const args = {
        mutation: {
            proccode: 'undefined proc'
        }
    };
    const util = {
        getProcedureParamNamesIdsAndDefaults: () => null,
        stackFrame: {
            executed: false
        }
    };
    t.doesNotThrow(() => {
        blocks.call(args, util);
    });
    t.end();
});

test('calling a custom block binds callback parameters to SUBSTACK inputs', t => {
    const pushed = [];
    const util = {
        getProcedureParamNamesIdsAndDefaults: () => [
            ['branch'],
            ['SUBSTACKcallback'],
            ['']
        ],
        initParams: () => {},
        pushParam: (name, value) => pushed.push([name, value]),
        stackFrame: {executed: false},
        startProcedure: () => {},
        thread: {
            peekStack: () => 'caller'
        }
    };

    blocks.call({mutation: {proccode: 'procedure %c'}}, util);

    t.same(pushed, [[
        'branch',
        {entry: 'SUBSTACKcallback', callerId: 'caller'}
    ]]);
    t.end();
});

test('calling a custom block preserves the caller target for callbacks', t => {
    const callerTarget = {};
    const pushed = [];
    const util = {
        getProcedureParamNamesIdsAndDefaults: () => [
            ['branch'],
            ['SUBSTACKcallback'],
            ['']
        ],
        initParams: () => {},
        pushParam: (name, value) => pushed.push([name, value]),
        stackFrame: {executed: false},
        startProcedure: () => {},
        thread: {
            peekStack: () => 'caller',
            peekStackFrame: () => ({target: callerTarget})
        }
    };

    blocks.call({mutation: {proccode: 'procedure %c'}}, util);

    t.same(pushed, [[
        'branch',
        {entry: 'SUBSTACKcallback', callerId: 'caller', callerTarget}
    ]]);
    t.end();
});

test('statement argument reporter pushes the resolved callback branch', t => {
    const pushed = [];
    const target = {};
    const util = {
        getParam: () => ({entry: 'SUBSTACKcallback', callerId: 'caller'}),
        getBranchAndTarget: () => ['callback-start', target],
        thread: {
            pushStack: (id, branchTarget) => pushed.push([id, branchTarget])
        }
    };

    blocks.argumentReporterStatement({VALUE: 'branch'}, util);

    t.same(pushed, [['callback-start', target]]);
    t.end();
});

test('statement argument reporter resolves callbacks on the caller target', t => {
    const pushed = [];
    const callerTarget = {};
    const util = {
        getParam: () => ({entry: 'SUBSTACKcallback', callerId: 'caller', callerTarget}),
        getBranchAndTarget: (id, entry, target) => {
            t.equal(id, 'caller');
            t.equal(entry, 'SUBSTACKcallback');
            t.equal(target, callerTarget);
            return ['callback-start', target];
        },
        thread: {
            pushStack: (id, branchTarget) => pushed.push([id, branchTarget])
        }
    };

    blocks.argumentReporterStatement({VALUE: 'branch'}, util);

    t.same(pushed, [['callback-start', callerTarget]]);
    t.end();
});
