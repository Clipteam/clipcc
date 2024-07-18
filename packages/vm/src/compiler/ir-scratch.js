const constants = require('./constants');

/** @import IRGenerator from './ir-generator.js' */

// common blocks
const colour_picker = function (block, /** @type {IRGenerator} */ generator) {
    return {
        opcode: constants.IR_CONSTANT,
        value: generator.fromField(block, 'COLOUR')
    };
};

const math_number = function (block, /** @type {IRGenerator} */ generator) {
    return {
        opcode: constants.IR_CONSTANT,
        value: generator.fromField(block, 'NUM')
    };
};

const math_integer = math_number;

const math_whole_number = math_number;

const math_positive_number = math_number;

const math_angle = math_number;

const text = function (block, /** @type {IRGenerator} */ generator) {
    return {
        opcode: constants.IR_CONSTANT,
        value: generator.fromField(block, 'TEXT')
    };
};

// other test blocks
const control_forever = function (block, /** @type {IRGenerator} */ generator) {
    return {
        opcode: constants.IR_WHILE,
        test: {
            opcode: constants.IR_CONSTANT,
            value: true
        },
        body: generator.fromStatement(block, 'SUBSTACK')
    };
};

const control_repeat = function (block, /** @type {IRGenerator} */ generator) {
    return {
        opcode: constants.IR_REPEAT,
        times: generator.fromValue(block, 'TIMES'),
        body: generator.fromStatement(block, 'SUBSTACK')
    };
};

const control_if = function (block, /** @type {IRGenerator} */ generator) {
    return {
        opcode: constants.IR_IFELSE,
        test: generator.fromValue(block, 'CONDITION'),
        consequent: generator.fromStatement(block, 'SUBSTACK'),
        alternate: []
    };
};

const control_if_else = function (block, /** @type {IRGenerator} */ generator) {
    return {
        opcode: constants.IR_IFELSE,
        test: generator.fromValue(block, 'CONDITION'),
        consequent: generator.fromStatement(block, 'SUBSTACK'),
        alternate: generator.fromStatement(block, 'SUBSTACK2')
    };
};

const control_wait = function (block, /** @type {IRGenerator} */ generator) {
    return {
        opcode: constants.IR_WAIT,
        duration: generator.fromValue(block, 'DURATION')
    };
};

const operator_add = function (block, /** @type {IRGenerator} */ generator) {
    return {
        opcode: constants.IR_ADD,
        left: generator.fromValue(block, 'NUM1'),
        right: generator.fromValue(block, 'NUM2')
    };
};

const operator_sub = function (block, /** @type {IRGenerator} */ generator) {
    return {
        opcode: constants.IR_SUB,
        left: generator.fromValue(block, 'NUM1'),
        right: generator.fromValue(block, 'NUM2')
    };
};

const data_variable = function (block, /** @type {IRGenerator} */ generator) {
    return {
        opcode: constants.IR_LOAD,
        variable: generator.fromVariable(block, 'VARIABLE')
    };
};

const data_setvariableto = function (block, /** @type {IRGenerator} */ generator) {
    return {
        opcode: constants.IR_STORE,
        variable: generator.fromVariable(block, 'VARIABLE'),
        value: generator.fromValue(block, 'VALUE')
    };
};

module.exports = {
    colour_picker,
    math_number,
    math_integer,
    math_whole_number,
    math_positive_number,
    math_angle,
    text,

    control_forever,
    control_repeat,
    control_if,
    control_if_else,
    control_wait,
    operator_add,
    operator_sub,
    data_variable,
    data_setvariableto
};
