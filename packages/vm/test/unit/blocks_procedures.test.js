const Procedures = require('../../src/blocks/scratch3_procedures');

const blocks = new Procedures(null);

test('getPrimitives', () => {
    expect(typeof blocks.getPrimitives()).toBe('object');
});

// Originally inspired by https://github.com/LLK/scratch-gui/issues/809
test('calling a custom block with no definition does not throw', () => {
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
    expect(() => {
        blocks.call(args, util);
    }).not.toThrow();
});
