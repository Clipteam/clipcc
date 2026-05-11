import Cast from '../util/cast';
import type {BlockArgs, CategoryPrototype} from './category_prototype';
import type Runtime from '../engine/runtime';
import type RenderedTarget from '../sprites/rendered-target';
import type BlockUtility from '../engine/block-utility';
import type {BaseExecutionContext} from '../engine/block-utility';

interface ControlExecutionContext extends BaseExecutionContext {
    loopCounter?: number;
    index?: number;
}

class Scratch3ControlBlocks implements CategoryPrototype {
    /**
     * The "counter" block value. For compatibility with 2.0.
     */
    private _counter = 0;
    constructor (
        /**
         * The runtime instantiating this block package.
         */
        public runtime: Runtime
    ) {
        this.runtime.on('RUNTIME_DISPOSED', this.clearCounter.bind(this));
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @returns Mapping of opcode to Function.
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

    getHats () {
        return {
            control_start_as_clone: {
                restartExistingThreads: false
            }
        };
    }

    repeat (args: BlockArgs, util: BlockUtility) {
        const times = Math.round(Cast.toNumber(args.TIMES));
        // Initialize loop
        if (typeof util.stackFrame.loopCounter === 'undefined') {
            util.stackFrame.loopCounter = times;
        }
        // Only execute once per frame.
        // When the branch finishes, `repeat` will be executed again and
        // the second branch will be taken, yielding for the rest of the frame.
        // Decrease counter
        (util.stackFrame as ControlExecutionContext).loopCounter!--;
        // If we still have some left, start the branch.
        if ((util.stackFrame as ControlExecutionContext).loopCounter! >= 0) {
            util.startBranch(1, true);
        }
    }

    repeatUntil (args: BlockArgs, util: BlockUtility) {
        const condition = Cast.toBoolean(args.CONDITION);
        // If the condition is false (repeat UNTIL), start the branch.
        if (!condition) {
            util.startBranch(1, true);
        }
    }

    repeatWhile (args: BlockArgs, util: BlockUtility) {
        const condition = Cast.toBoolean(args.CONDITION);
        // If the condition is true (repeat WHILE), start the branch.
        if (condition) {
            util.startBranch(1, true);
        }
    }

    forEach (args: BlockArgs, util: BlockUtility) {
        const variable = util.target.lookupOrCreateVariable(
            args.VARIABLE.id, args.VARIABLE.name);

        if (typeof util.stackFrame.index === 'undefined') {
            util.stackFrame.index = 0;
        }

        if ((util.stackFrame as ControlExecutionContext).index! < Number(args.VALUE)) {
            (util.stackFrame as ControlExecutionContext).index!++;
            variable.value = (util.stackFrame as ControlExecutionContext).index;
            util.startBranch(1, true);
        }
    }

    waitUntil (args: BlockArgs, util: BlockUtility) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (!condition) {
            util.yield();
        }
    }

    forever (args: BlockArgs, util: BlockUtility) {
        util.startBranch(1, true);
    }

    wait (args: BlockArgs, util: BlockUtility) {
        if (util.stackTimerNeedsInit()) {
            const duration = Math.max(0, 1000 * Cast.toNumber(args.DURATION));

            util.startStackTimer(duration);
            this.runtime.requestRedraw();
            util.yield();
        } else if (!util.stackTimerFinished()) {
            util.yield();
        }
    }

    if (args: BlockArgs, util: BlockUtility) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (condition) {
            util.startBranch(1, false);
        }
    }

    ifElse (args: BlockArgs, util: BlockUtility) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (condition) {
            util.startBranch(1, false);
        } else {
            util.startBranch(2, false);
        }
    }

    stop (args: BlockArgs, util: BlockUtility) {
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

    createClone (args: BlockArgs, util: BlockUtility) {
        // Cast argument to string
        args.CLONE_OPTION = Cast.toString(args.CLONE_OPTION);

        // Set clone target
        let cloneTarget: RenderedTarget | undefined;
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

    deleteClone (args: BlockArgs, util: BlockUtility) {
        if (!util.target.isOriginal) return;
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

    allAtOnce (args: BlockArgs, util: BlockUtility) {
        // Since the "all at once" block is implemented for compatiblity with
        // Scratch 2.0 projects, it behaves the same way it did in 2.0, which
        // is to simply run the contained script (like "if 1 = 1").
        // (In early versions of Scratch 2.0, it would work the same way as
        // "run without screen refresh" custom blocks do now, but this was
        // removed before the release of 2.0.)
        util.startBranch(1, false);
    }
}

export default Scratch3ControlBlocks;
