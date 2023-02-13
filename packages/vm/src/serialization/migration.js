/**
 * @fileoverview
 * Migration from legacy ClipCC.
 */

const opcodeMap = {
    procedures_definition_return: 'procedures_definition',
    procedures_prototype_return: 'procedures_prototype',
    procedures_call_return: 'procedures_call'
};

module.exports = {
    opcodeMap
};
