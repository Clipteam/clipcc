const constants = require('./constants');

/**
 * Get JS string literal.
 * @param {string} str string
 * @return {string} quoted string
 */
const quote = function (str) {
    return JSON.stringify(str);
}

class TypedExpression {
    /**
     * @param {string} code
     * @param {number} type
     */
    constructor (code, type) {
        this.code = code;
        this.type = type;
    }

    asNumber () {
        if (this.type === constants.TYPE_NUMBER) {
            return this.code;
        } else {
            //return `+(${this.code}) || 0`
            return `Cast.toNumber(${this.code})`
        }
    }

    asBoolean () {
        if (this.type === constants.TYPE_NUMBER) {
            return this.code;
        } else {
            return `Cast.toBoolean(${this.code})`
        }
    }
}

class JSGenerator {
    /**
     * @param {Blocks} blockContainer
     */
    constructor () {}

    /**
     * Generate JavaScript for single thread.
     * @param {IRInst[]} irList list of IR instruction
     * @return {Function} generated function
     */
    compileForThread (irList) {
        return new Function([
            'return (function (thread) {',
            'const target = thread.target;',
            'const stage = target.runtime.getTargetForStage();',
            'const {Cast} = this;',
            'return (function* () {',
            this.generateInstructionList(irList).code + ';',
            '});})'
        ].join(''));
    }

    /**
     * Generate JavaScript code for IR instructions.
     * @param {IRInst[]} irList list of IR instruction
     * @return {TypedExpression} generated code
     */
    generateInstructionList (irList) {
        const codes = [];

        for (const ir of irList) {
            const code = this.generateInstruction(ir);
            codes.push(code.code);
        }

        return new TypedExpression(codes.join(';'), constants.TYPE_STATEMENT);
    }

    /**
     * Generate JavaScript code for IR instruction.
     * @param {IRInst} ir IR instruction
     * @return {TypedExpression} generated code
     */
    generateInstruction (ir) {
        switch (ir.opcode) {
            case constants.IR_CONSTANT: {
                return new TypedExpression(ir.value, constants.TYPE_UNKNOWN);
            }
            case constants.IR_IDENTIFIER: {
                if (ir.scope === 'stage') {
                    return new TypedExpression(`stage.variables[${quote(ir.id)}].value`, constants.TYPE_UNKNOWN);
                } else {
                    return new TypedExpression(`target.variables[${quote(ir.id)}].value`, constants.TYPE_UNKNOWN);
                }
            }
            case constants.IR_WHILE: {
                const test = this.generateInstruction(ir.test);
                const body = this.generateInstructionList(ir.body);
                return new TypedExpression(
                    `while (${test.asNumber()}) {${body.code}}`,
                    constants.TYPE_STATEMENT
                );
            }
            case constants.IR_REPEAT: {
                const times = this.generateInstruction(ir.times);
                const body = this.generateInstructionList(ir.body);
                return new TypedExpression(
                    `for (let i = Math.round(${times.asNumber()}); i >= 0; --i) {${body.code}}`,
                    constants.TYPE_STATEMENT
                );
            }
            case constants.IR_IFELSE: {
                const test = this.generateInstruction(ir.test);
                const consequent = this.generateInstructionList(ir.consequent);
                const alternate = this.generateInstructionList(ir.alternate);
                return new TypedExpression(
                    `if (${test}) {${consequent.code}} else {${alternate.code}}`,
                    constants.TYPE_STATEMENT
                );
            }
            case constants.IR_WAIT: {
                return new TypedExpression(
                    'console.log(wait)',
                    constants.TYPE_STATEMENT
                );
            }
            case constants.IR_ADD: {
                const left = this.generateInstruction(ir.left);
                const right = this.generateInstruction(ir.right);
                return new TypedExpression(
                    `(${left.asNumber()}) + (${right.asNumber()})`,
                    constants.TYPE_NUMBER
                );
            }
            case constants.IR_SUB: {
                const left = this.generateInstruction(ir.left);
                const right = this.generateInstruction(ir.right);
                return new TypedExpression(
                    `(${left.asNumber()}) - (${right.asNumber()})`,
                    constants.TYPE_NUMBER
                );
            }
            case constants.IR_LOAD: {
                return this.generateInstruction(ir.variable);
            }
            case constants.IR_STORE: {
                const variable = this.generateInstruction(ir.variable);
                const value = this.generateInstruction(ir.value);
                return new TypedExpression(
                    `(${variable.code}) = (${value.code})`,
                    constants.TYPE_STATEMENT
                );
            }
            default: {
                throw 'unknown ir instruction';
            }
        }
    }
}

module.exports = JSGenerator;
