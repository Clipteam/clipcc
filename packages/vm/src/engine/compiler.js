const Cast = require('../util/cast');

/**
 * It's possible to compile the blocks in a thread
 * into code and convert them into function.
 */
class Compiler {
    constructor (runtime) {
        this.runtime = runtime;
        this.generators = runtime._generators;
    }

    compileThread (thread) {
        const compilation = new Compilation(this.runtime, thread);
        compilation.generateStack(thread.topBlock);
        return compilation;
    }
}

const ParamType = {
    NUMBER: 1,
    NUMBER_NAN: 2,
    STRING: 3,
    BOOLEAN: 4,
    UNKNOWN: 99
}

/**
 * Make a JavaScript string purified.
 * @param {string} string of unknown format
 * @returns {string} sanitized string
 */
const sanitize = string => JSON.stringify(String(string)).slice(1, -1);

/**
 * Current block's scope.
 */
class Scope {
    constructor (isLoop, warpMode) {
        this.warpMode = warpMode;
        this.isLoop = isLoop;
        this.isBottom = false;
    }
}

/**
 * Package a block parameter and provide type
 * conversion support.
 */
class BlockParam {
    constructor ({constant, type, result}) {
        this.constant = constant;
        this.type = type;
        this.source = result;
    }

    asNumber () {
        if (this.constant) {
            const number = +this.source;
            if (number) return number.toString();
            if (Object.is(number, -0)) return '-0';
            return '0';
        }

        if (this.type === ParamType.NUMBER) return this.source;
        if (this.type === ParamType.NUMBER_NAN) return `(${this.source} || 0)`;
        return `(+${this.source} || 0)`;
    }

    asNumberOrNaN () {
        if (this.constant) return this.asNumber();
        if (this.type === ParamType.NUMBER || this.type === ParamType.NUMBER_NAN) return this.source;
        return `(+${this.source})`;
    }

    asString () {
        if (this.constant) {
            return `"${sanitize('' + this.source)}"`;
        }
        if (this.type === ParamType.STRING) return this.source;
        return `("" + ${this.source})`;
    }

    asBoolean () {
        if (this.constant) {
            return Cast.toBoolean(this.source).toString();
        }
        if (this.type === ParamType.BOOLEAN) return this.source;
        return `Cast.toBoolean(${this.source})`;
    }

    asColor () {
        if (this.constant) {
                if (/^#[0-9a-f]{6,8}$/i.test(this.source)) {
                const hex = this.source.substr(1);
                return Number.parseInt(hex, 16).toString();
            }
        }
        return this.asUnknown();
    }

    asUnknown () {
        if (this.constant) {
            if (typeof this.source === 'number') {
                return this.source;
            }
            const number = +this.source;
            if (number.toString() === this.source) {
                return this.source;
            }
            return this.asString();
        }
        return this.source;
    }
}

/**
 * A compilation transaction, which generates the
 * corresponding code and runtime environment info
 * from a thread.
 */
class Compilation {
    constructor (runtime, thread) {
        this.thread = thread;
        this.runtime = runtime;
        this.flyoutBlocks = runtime.flyoutBlocks;
        this.code = '';
        this.scopes = [];
        /**
         * Whether the code contains a yield statement.
         * Compiler needs to determine if the final
         * function is a generator.
         */
        this.yield = false;
        this.currentBlockId = null;
    }

    get currentScope () {
        return this.scopes[this.scopes.length - 1];
    }

    enterScope (isLoop, warpMode = this.currentScope.warpMode) {
        this.scopes.push(new Scope(isLoop, warpMode));
    }

    exitScope () {
        this.scopes.pop();
    }

    enableYield () {
        if (!this.yield) this.yield = true;
    }

    enableWarp () {
        if (!this.warp) this.warp = true;
    }

    getBlock (blockId) {
        return this.thread.blockContainer.getBlock(blockId)
            || this.flyoutBlocks.getBlock(blockId);
    }

    generateStack (blockId, isLoop, warpMode) {
        this.currentBlockId = blockId;
        let stackLength = 0;
        // analyze stack length
        while (this.currentBlockId !== null) {
            const currentBlock = this.getBlock(this.currentBlockId);
            if (!currentBlock) break;
            stackLength++;
            this.currentBlockId = currentBlock.next;
        }

        // really start generating
        this.enterScope(isLoop, warpMode);
        this.currentBlockId = blockId;
        for (let i = 1; i <= stackLength; i++) {
            if (i === stackLength) this.currentScope.isBottom = true;

            const currentBlock = this.getBlock(this.currentBlockId);
            this.generateBlock(currentBlock);
            this.currentBlockId = currentBlock.next;
        }
        this.exitScope();
    }

    generateBlock (block) {
        // skip hat block.
        if (runtime.getIsHat(block.opcode)) return;

        const blockArgs = this.processArgs(block);

        // generate input by it's generator if possible
        if (this.runtime.generators.hasOwnProperty(block.opcode)) {
            this.runtime.generators[block.opcode](blockArgs, this);
        } else {
            this.code += `${this.generateCompatBlock(block, blockArgs)}\n`;
        }
    }

    generateInput (inputBlockId) {
        const block = this.getBlock(inputBlockId);
        // If there's a shadow block.
        const fieldKeys = Object.keys(block.fields);
        const isShadowBlock = (
            typeof this.runtime.getOpcodeFunction(block.opcode) === 'undefined' &&
            fieldKeys.length === 1 &&
            Object.keys(block.inputs).length === 0
        );
        if (isShadowBlock) return generateShadow(block);

        const blockArgs = this.processArgs(block);
        // generate input by it's generator if possible
        if (this.runtime.generators.hasOwnProperty(block.opcode)) {
            return this.runtime.generators[block.opcode](blockArgs, this);
        }

        return {
            constant: false,
            type: ParamType.UNKNOWN,
            result: this.generateCompatBlock(block, blockArgs);
        };
    }

    generateShadow (block) {
        const fieldKeys = Object.keys(block.fields);
        switch (block.opcode) {
        case 'math_angle':
        case 'math_integer':
        case 'math_number':
        case 'math_positive_number':
        case 'math_whole_number':
            return {
                constant: true,
                type: ParamType.NUMBER,
                result: block.fields.NUM.value
            };
        case 'text':
            return {
                constant: true,
                type: ParamType.STRING,
                result: block.fields.TEXT.value
            };
        case 'colour_picker':
            return {
                constant: true,
                type: ParamType.STRING,
                result: block.fields.COLOUR.value
            };
        default:
            return {
                constant: true,
                type: ParamType.UNKNOWN,
                result: block.fields[fieldKeys[0]].value
            };
        }
    }

    processArgs (block) {
        const blockArgs = {};
        blockArgs.substacks = {};

        // store the static fields onto blockArgs.
        // @todo map internal field's type
        for (const fieldName in block.fields) {
            if (
                fieldName === 'VARIABLE' ||
                fieldName === 'LIST' ||
                fieldName === 'BROADCAST_OPTION'
            ) {
                blockArgs[fieldName] = new BlockParam({
                    constant: true,
                    type: ParamType.UNKNOWN,
                    result: JSON.stringify{
                        id: block.fields[fieldName].id,
                        name: block.fields[fieldName].value
                    }
                });
            } else {
                blockArgs[fieldName] = new BlockParam({
                    constant: true,
                    type: ParamType.UNKNOWN,
                    result: block.fields[fieldName].value
                });
            }
        }
        // store dynamic inputs (or substacks)
        for (const inputName in block.inputs) {
            const inputBlockId = block.inputs[inputName].block;
            if (inputName.startsWith('SUBSTACK')) {
                blockArgs.substacks[inputName] = inputBlockId;
            } else {
                blockArgs[inputName] = new BlockParam(this.generateInput(inputBlockId));
            }
        }
        return blockArgs;
    }

    generateCompatBlock (block, args) {
        if (!this.yield) this.enableYield();
        let call = `yield* compatCall(${block.opcode}, {`;
        const params = [];
        for (const argName in args) {
            params.push(`${argName}: ${args[argName].asUnknown()}`);
        }
        call += `${params.join(', ')}}, ${this.warp})`;
        return call;
    }
}

module.exports = Compiler;
