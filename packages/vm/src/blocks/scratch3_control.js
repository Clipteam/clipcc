const Cast = require('../util/cast');

class Scratch3ControlBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * The "counter" block value. For compatibility with 2.0.
         * @type {number}
         */
        this._counter = 0;

        this.runtime.on('RUNTIME_DISPOSED', this.clearCounter.bind(this));
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            control_repeat: this.repeat,
            control_repeat_until: this.repeatUntil,
            control_while: this.repeatWhile,
            control_for_each: this.forEach,
            control_forever: this.forever,
            control_wait: this.wait,
            control_wait_until: this.waitUntil,
            control_if: this.if,
            control_if_else: this.ifElse,
            control_stop: this.stop,
            control_create_clone_of: this.createClone,
            control_delete_this_clone: this.deleteClone,
            control_get_counter: this.getCounter,
            control_incr_counter: this.incrCounter,
            control_clear_counter: this.clearCounter,
            control_all_at_once: this.allAtOnce
        };
    }

    getGenerators () {
        return {
            control_repeat: this.grepeat,
            control_repeat_until: this.grepeatUntil,
            control_while: this.grepeatWhile,
            control_forever: this.gforever,
            control_wait_until: this.gwaitUntil,
            control_if: this.gif,
            control_if_else: this.gifElse,
            control_stop: this.gstop,
        };
    }

    getHats () {
        return {
            control_start_as_clone: {
                restartExistingThreads: false
            }
        };
    }

    repeat (args, util) {
        const times = Math.round(Cast.toNumber(args.TIMES));
        // Initialize loop
        if (typeof util.stackFrame.loopCounter === 'undefined') {
            util.stackFrame.loopCounter = times;
        }
        // Only execute once per frame.
        // When the branch finishes, `repeat` will be executed again and
        // the second branch will be taken, yielding for the rest of the frame.
        // Decrease counter
        util.stackFrame.loopCounter--;
        // If we still have some left, start the branch.
        if (util.stackFrame.loopCounter >= 0) {
            util.startBranch(1, true);
        }
    }

    grepeat (args, ctx) {
        ctx.code += `for (let i = 0; i < ${args.TIMES.asNumber()}; i++) {\n`;
        if ('SUBSTACK' in args.substacks) {
            ctx.generateStack(args.substacks.SUBSTACK, true);
        }
        if (!ctx.currentScope.warpMode) {
            ctx.enableYield();
            ctx.code += 'yield;\n'
        }
        ctx.code += '}\n';
    }

    repeatUntil (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        // If the condition is false (repeat UNTIL), start the branch.
        if (!condition) {
            util.startBranch(1, true);
        }
    }

    grepeatUntil (args, ctx) {
        ctx.code += `while (${args.CONDITION.asBoolean()}) {\n`;
        if ('SUBSTACK' in args.substacks) {
            ctx.generateStack(args.substacks.SUBSTACK, true);
        }
        if (!ctx.currentScope.warpMode) {
            ctx.enableYield();
            ctx.code += 'yield;\n'
        }
        ctx.code += '}\n';
    }

    repeatWhile (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        // If the condition is true (repeat WHILE), start the branch.
        if (condition) {
            util.startBranch(1, true);
        }
    }

    grepeatWhile (args, ctx) {
        ctx.code += `while !((${args.CONDITION.asBoolean()})) {\n`;
        if ('SUBSTACK' in args.substacks) {
            ctx.generateStack(args.substacks.SUBSTACK, true);
        }
        if (!ctx.currentScope.warpMode) {
            ctx.enableYield();
            ctx.code += 'yield;\n'
        }
        ctx.code += '}\n';
    }

    forEach (args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.VARIABLE.id, args.VARIABLE.name);

        if (typeof util.stackFrame.index === 'undefined') {
            util.stackFrame.index = 0;
        }

        if (util.stackFrame.index < Number(args.VALUE)) {
            util.stackFrame.index++;
            variable.value = util.stackFrame.index;
            util.startBranch(1, true);
        }
    }

    waitUntil (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (!condition) {
            util.yield();
        }
    }

    gwaitUntil (args, ctx) {
        ctx.enableYield();
        ctx.code += `while (!(${args.CONDITION.asBoolean()})) {\n`;
        if (!ctx.currentScope.warpMode) {
            ctx.enableYield();
            ctx.code += 'yield;\n'
        }
        ctx.code += '}\n';
    }

    forever (args, util) {
        util.startBranch(1, true);
    }

    gforever (args, ctx) {
        ctx.code += `while (true) {\n`;
        if ('SUBSTACK' in args.substacks) {
            ctx.generateStack(args.substacks.SUBSTACK, true);
        }
        if (!ctx.currentScope.warpMode) {
            ctx.enableYield();
            ctx.code += 'yield;\n'
        }
        ctx.code += '}\n';
    }

    wait (args, util) {
        if (util.stackTimerNeedsInit()) {
            const duration = Math.max(0, 1000 * Cast.toNumber(args.DURATION));

            util.startStackTimer(duration);
            this.runtime.requestRedraw();
            util.yield();
        } else if (!util.stackTimerFinished()) {
            util.yield();
        }
    }

    if (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (condition) {
            util.startBranch(1, false);
        }
    }

    gif (args, ctx) {
        ctx.code += `if (${args.CONDITION.asBoolean()}) {`;
        if ('SUBSTACK' in args.substacks) {
            ctx.generateStack(args.substacks.SUBSTACK);
        }
        ctx.code += '}\n';
    }

    ifElse (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (condition) {
            util.startBranch(1, false);
        } else {
            util.startBranch(2, false);
        }
    }

    gifElse (args, ctx) {
        ctx.code += `if (${args.CONDITION.asBoolean()}) {`;
        if ('SUBSTACK' in args.substacks) {
            ctx.generateStack(args.substacks.SUBSTACK);
        }
        ctx.code += '} else {\n';
        if ('SUBSTACK2' in args.substacks) {
            ctx.generateStack(args.substacks.SUBSTACK2);
        }
        ctx.code += '}\n';
    }

    stop (args, util) {
        const option = args.STOP_OPTION;
        if (option === 'all') {
            util.stopAll();
        } else if (option === 'other scripts in sprite' ||
            option === 'other scripts in stage') {
            util.stopOtherTargetThreads();
        } else if (option === 'this script') {
            util.stopThisScript();
        }
    }

    gstop (args, ctx) {
        // always constant
        const option = args.STOP_OPTION.source;
        switch (option) {
        case 'all':
            ctx.code += `runtime.stopAll();\n`;
            break;
        case 'other scripts in stage':
            ctx.code += `runtime.stopForTarget(target, thread);\n`;
            break;
        case 'this script':
            ctx.code += 'return;\n';
            break;
        }
    }

    createClone (args, util) {
        // Cast argument to string
        args.CLONE_OPTION = Cast.toString(args.CLONE_OPTION);

        // Set clone target
        let cloneTarget;
        if (args.CLONE_OPTION === '_myself_') {
            cloneTarget = util.target;
        } else {
            cloneTarget = this.runtime.getSpriteTargetByName(args.CLONE_OPTION);
        }

        // If clone target is not found, return
        if (!cloneTarget) return;

        // Create clone
        const newClone = cloneTarget.makeClone();
        if (newClone) {
            this.runtime.addTarget(newClone);

            // Place behind the original target.
            newClone.goBehindOther(cloneTarget);
        }
    }

    deleteClone (args, util) {
        if (util.target.isOriginal) return;
        this.runtime.disposeTarget(util.target);
        this.runtime.stopForTarget(util.target);
    }

    getCounter () {
        return this._counter;
    }

    clearCounter () {
        this._counter = 0;
    }

    incrCounter () {
        this._counter++;
    }

    allAtOnce (args, util) {
        // Since the "all at once" block is implemented for compatiblity with
        // Scratch 2.0 projects, it behaves the same way it did in 2.0, which
        // is to simply run the contained script (like "if 1 = 1").
        // (In early versions of Scratch 2.0, it would work the same way as
        // "run without screen refresh" custom blocks do now, but this was
        // removed before the release of 2.0.)
        util.startBranch(1, false);
    }
}

module.exports = Scratch3ControlBlocks;
