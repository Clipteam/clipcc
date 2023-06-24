const md5 = require('md5');
const {BlockParam} = require('../engine/compiler');

class Scratch3ProcedureBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            procedures_definition: this.definition,
            procedures_call: this.call,
            argument_reporter_string_number: this.argumentReporterStringNumber,
            argument_reporter_boolean: this.argumentReporterBoolean
        };
    }

    getGenerators () {
        return {
            procedures_definition: this.gdefinition,
            procedures_call: this.gcall,
            argument_reporter_string_number: this.gargumentReporterStringNumber,
            argument_reporter_boolean: this.gargumentReporterBoolean
        };
    }

    definition () {
        // No-op: execute the blocks.
    }

    gdefinition () {
        // No-op: unnecessary
    }

    call (args, util) {
        if (!util.stackFrame.executed) {
            const procedureCode = args.mutation.proccode;
            const paramNamesIdsAndDefaults = util.getProcedureParamNamesIdsAndDefaults(procedureCode);

            // If null, procedure could not be found, which can happen if custom
            // block is dragged between sprites without the definition.
            // Match Scratch 2.0 behavior and noop.
            if (paramNamesIdsAndDefaults === null) {
                return;
            }

            const [paramNames, paramIds, paramDefaults] = paramNamesIdsAndDefaults;

            // Initialize params for the current stackFrame to {}, even if the procedure does
            // not take any arguments. This is so that `getParam` down the line does not look
            // at earlier stack frames for the values of a given parameter (#1729)
            util.initParams();
            for (let i = 0; i < paramIds.length; i++) {
                if (args.hasOwnProperty(paramIds[i])) {
                    util.pushParam(paramNames[i], args[paramIds[i]]);
                } else {
                    util.pushParam(paramNames[i], paramDefaults[i]);
                }
            }

            util.stackFrame.executed = true;
            util.startProcedure(procedureCode);
        }
    }

    gcall (args, ctx) {
        const procCode = args.mutation.proccode;
        const paramNamesIdsAndDefaults = ctx.thread.blockContainer.getProcedureParamNamesIdsAndDefaults(procCode);

        // If null, procedure could not be found, which can happen if custom
        // block is dragged between sprites without the definition.
        // Match Scratch 2.0 behavior and noop.
        if (paramNamesIdsAndDefaults === null) {
            return;
        }

        let defCtx = ctx.generateProcedure(procCode);
        // it's in recursive call, force using generator.
        // @todo should be judged via final compilation, but
        // there's no way to access it now.
        if (!defCtx) {
            defCtx = {
                yield: ctx.yield
            };
        }
        if (defCtx.yield) {
            ctx.enableYield();
            ctx.code += 'yield* ';
        }
        ctx.code += `proc_${md5(procCode)}(`;
        const [paramNames, paramIds, paramDefaults] = paramNamesIdsAndDefaults;
        ctx.arguments = paramNames;
        const params = [];
        const block = ctx.getBlock(ctx.currentBlockId);
        for (let i = 0; i < paramIds.length; i++) {
            if (block.inputs[paramIds[i]] && block.inputs[paramIds[i]].block) {
                const param = new BlockParam(ctx.generateInput(block.inputs[paramIds[i]].block));
                params.push(param.asUnknown());
            } else {
                const param = new BlockParam({
                    constant: true,
                    type: 99 /* UNKNOWN */,
                    result: paramDefaults[i]
                });
                params.push(param.asUnknown());
            }
        }
        ctx.code += `${params.join(', ')});\n`;
    }

    argumentReporterStringNumber (args, util) {
        const value = util.getParam(args.VALUE);
        if (value === null) {
            // When the parameter is not found in the most recent procedure
            // call, the default is always 0.
            return 0;
        }
        return value;
    }

    gargumentReporterStringNumber (args, ctx) {
        const index = ctx.arguments.lastIndexOf(args.VALUE.source);
        if (index === -1) {
            return {
                constant: true,
                type: 1 /* NUMBER */,
                result: 0
            };
        }
        return {
            constant: false,
            type: 99 /* UNKNOWN */,
            result: `(args[${index}] || 0)`
        };
    }

    argumentReporterBoolean (args, util) {
        const value = util.getParam(args.VALUE);
        if (value === null) {
            // When the parameter is not found in the most recent procedure
            // call, the default is always 0.
            return 0;
        }
        return value;
    }

    gargumentReporterBoolean (args, ctx) {
        const index = ctx.arguments.lastIndexOf(args.VALUE.source);
        if (index === -1) {
            return {
                constant: true,
                type: 1 /* NUMBER */,
                result: 0
            };
        }
        return {
            constant: false,
            type: 4 /* BOOLEAN */,
            result: `Cast.toBoolean(args[${index}])`
        };
    }
}

module.exports = Scratch3ProcedureBlocks;
