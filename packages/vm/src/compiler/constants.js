const TYPE_NUMBER = 1;
const TYPE_STRING = 2;
const TYPE_STATEMENT = 8;
const TYPE_UNKNOWN = 99;

const IR_CONSTANT = 'constant';
const IR_IDENTIFIER = 'identifier';
const IR_WHILE = 'control.while';
const IR_REPEAT = 'control.repeat';
const IR_IFELSE = 'control.ifelse';
const IR_WAIT = 'control.wait';
const IR_ADD = 'op.add';
const IR_SUB = 'op.sub';
const IR_LOAD = 'var.load';
const IR_STORE = 'var.store';

module.exports = {
    TYPE_NUMBER,
    TYPE_STRING,
    TYPE_STATEMENT,
    TYPE_UNKNOWN,

    IR_CONSTANT,
    IR_IDENTIFIER,
    IR_WHILE,
    IR_REPEAT,
    IR_IFELSE,
    IR_WAIT,
    IR_ADD,
    IR_SUB,
    IR_LOAD,
    IR_STORE
};
