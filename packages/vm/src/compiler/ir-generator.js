const ScratchIRGenerator = require('./ir-scratch');

class IRGenerator {
    /**
     * @param {Blocks} blockContainer
     */
    constructor (blockContainer) {
        this.blockContainer = blockContainer;
        this.generator = ScratchIRGenerator;
    }

    /**
     * Generate IR for a list of blocks.
     * @param {?string} blockId top block id
     * @return {IRBaseInst[]} list of ir instructions
     */
    generateScript (blockId) {
        const result = [];

        while (blockId) {
            const block = this.blockContainer.getBlock(blockId);
            if (!block) {
                break;
            }

            result.push(this.generateBlock(blockId));
            blockId = block.next; // next block
        }

        return result;
    }

    /**
     * Generate IR for a block.
     * @param {?string} blockId block id
     * @return {IRBaseInst} ir instruction
     */
    generateBlock (blockId) {
        const block = blockId && this.blockContainer.getBlock(blockId);
        if (!block) {
            return null;
        }

        const opcode = block.opcode;

        const generate = this.generator[opcode];
        if (generate) {
            return generate(block, this);
        } else {
            console.warn(`no ir generator for opcode ${opcode}`);
            return IRGenerator.defaultGenerator(block, this);
        }
    }

    static defaultGenerator (block, generator) {
        // TODO: compatible mode
        return null;
    }

    /**
     * Generate IR from field.
     * @param {Object} block block to generate ir
     * @param {string} name field name
     * @return {IRBaseInst}
     */
    fromField (block, name) {
        if (block.fields.hasOwnProperty(name)) {
            return block.fields[name].value;
        } else {
            throw `no field ${name} in block ${block.opcode}`;
        }
    }

    /**
     * Generate IR from field.
     * @param {Object} block block to generate ir
     * @param {string} name value name
     * @return {IRBaseInst}
     */
    fromValue (block, name) {
        if (block.inputs.hasOwnProperty(name)) {
            const blockId = block.inputs[name].block;
            return this.generateBlock(blockId);
        } else {
            throw `no input ${name} in block ${block.opcode}`;
        }
    }

    /**
     * Generate IR from statement.
     * @param {Object} block block to generate ir
     * @param {string} name statement name
     * @return {IRBaseInst[]}
     */
    fromStatement (block, name) {
        if (block.inputs.hasOwnProperty(name)) {
            const blockId = block.inputs[name].block;
            return this.generateScript(blockId);
        } else {
            // input undefined when no block is connected to substack
            return [];
        }
    }
}

module.exports = IRGenerator;
