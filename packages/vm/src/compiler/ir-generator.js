const { IR_IDENTIFIER } = require('./constants');
const ScratchIRGenerator = require('./ir-scratch');

/** @import Blocks from '../engine/blocks' */
/** @import Target from '../engine/target' */
/** @import Thread from '../engine/thread' */

class IRGenerator {
    /**
     * @param {Thread} thread
     */
    constructor (thread) {
        this.thread = thread;
        this.blockContainer = /** @type {Blocks} */ (thread.blockContainer);
        this.generator = ScratchIRGenerator;

        this.clear();
    }

    /**
     * Clear compiler context.
     */
    clear () {
        this.variables = {};
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

    /**
     * Generate IR from variable field.
     * @param {Object} block block to generate ir
     * @param {string} name field name
     * @return {IRBaseInst[]}
     */
    fromVariable (block, name) {
        if (block.fields.hasOwnProperty(name)) {
            const field = block.fields[name];
            return this.lookupVariable(field.name, field.id);
        } else {
            throw `no variable field ${name} in block ${block.opcode}`;
        }
    }

    /**
     * Generate IR from variable.
     * @param {string} name name of data
     * @param {string} id id of data
     * @return {IRBaseInst}
     */
    lookupVariable (name, id) {
        const target = /** @type {Target} */ (this.thread.target);
        const stage = /** @type {?Target} */ (target.runtime.getTargetForStage());
        
        // lookup by id
        if (target.variables.hasOwnProperty(id)) {
            return {
                opcode: IR_IDENTIFIER,
                name: name,
                id: id,
                scope: 'target'
            };
        }
        
        // lookup in stage by id
        if (!target.isStage && stage) {
            if (stage.variables.hasOwnProperty(id)) {
                return {
                    opcode: IR_IDENTIFIER,
                    name: name,
                    id: id,
                    scope: 'stage'
                };
            }
        }

        // lookup by name
        for (const varId in this.variables) {
            const currVar = this.variables[varId];
            if (currVar.name === name && currVar.type === '') {
                return {
                    opcode: IR_IDENTIFIER,
                    name: name,
                    id: varId,
                    scope: 'target'
                };
            }
        }
        
        // lookup in stage by name
        if (!target.isStage && stage) {
            for (const varId in stage.variables) {
                const currVar = stage.variables[varId];
                if (currVar.name === name && currVar.type === '') {
                    return {
                        opcode: IR_IDENTIFIER,
                        name: name,
                        id: varId,
                        scope: 'stage'
                    };
                }
            }
        }

        // create a new variable in current target
        return {
            opcode: IR_IDENTIFIER,
            name: name,
            id: varId,
            scope: 'target'
        };
    }
}

module.exports = IRGenerator;
