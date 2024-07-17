const constants = require('./constants');

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
            default: {
                throw 'unknown ir instruction';
            }
        }
    }
}

module.exports = JSGenerator;
