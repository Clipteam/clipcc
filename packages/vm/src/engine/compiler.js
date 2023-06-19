const Cast = require('../util/cast');

const ParamType = {
    NUMBER: 1,
    NUMBER_NAN: 2,
    STRING: 3,
    BOOLEAN: 4,
    UNKNOWN: 99
}

const sanitize = string => JSON.stringify(String(string)).slice(1, -1);

class Domain {
    constructor (isLoop) {
        this.isLoop = isLoop;
        this.isBottom = false;
    }
}

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

class Compiler {
    constructor (runtime) {
        this.runtime = runtime;
        this.generators = runtime._generators;
    }

    compileThread (thread) {
        
    }
}

class Compilation {
    constructor (runtime, thread) {
        this.thread = thread;
        this.runtime = runtime;
        this.flyoutBlocks = runtime.flyoutBlocks;
        this.code = '';
        this.domains = [];
        this.yield = false;
        this.warp = false;
        this.currentBlockId = null;
    }

    get currentDomain () {
        return this.domains[this.domains.length - 1];
    }

    enterDomain (isLoop) {
        this.domains.push(new Domain(isLoop));
    }

    exitDomain () {
        this.domains.pop();
    }

    getBlock (blockId) {
        return this.thread.blockContainer.getBlock(blockId)
            || this.flyoutBlocks.getBlock(blockId);
    }

    generateStack (blockId) {
        this.currentBlockId = blockId;
        let stackLength = 0;
        while (this.currentBlockId !== null) {
            const currentBlock = this.getBlock(this.currentBlockId);
            if (!currentBlock) break;
            stackLength++;
            this.currentBlockId = currentBlock.next;
        }

        this.currentBlockId = blockId;
        for (let i = 1; i <= stackLength; i++) {
            if (i === stackLength) this.currentDomain.isBottom = true;
            else this.currentDomain.isBottom = false;

            const currentBlock = this.getBlock(this.currentBlockId);
            this.generateBlock(currentBlock);
            this.currentBlockId = currentBlock.next;
        }
    }

    generateBlock (block) {
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
        if (isShadowBlock) {
            return {
                constant: true,
                type: ParamType.UNKNOWN,
                result: block.fields[fieldKeys[0]].value
            };
        }

        const blockArgs = this.processArgs(block);
        // generate input by it's generator if possible
        if (this.runtime.generators.hasOwnProperty(block.opcode)) {
            return this.runtime.generators[block.opcode](blockArgs, this);
        } else {
            return {
                constant: false,
                type: ParamType.UNKNOWN,
                result: this.generateCompatBlock(block, blockArgs);
            };
        }
    }

    processArgs (block) {
        const blockArgs = {};
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
        // store dynamic inputs
        for (const inputName in block.inputs) {
            const inputBlockId = block.inputs[inputName].block;
            blockArgs[inputName] = new BlockParam(this.generateInput(inputBlockId));
        }
        return blockArgs;
    }

    generateCompatBlock (block, args) {
        if (!this.yield) this.yield = true;
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
