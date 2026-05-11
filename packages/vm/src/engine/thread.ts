import type Blocks from './blocks';
import type Timer from '../util/timer';
import type RenderedTarget from '../sprites/rendered-target';

/**
 * Recycle bin for empty stackFrame objects
 */
const _stackFrameFreeList: _StackFrame[] = [];

/**
 * A frame used for each level of the stack. A general purpose
 * place to store a bunch of execution context and parameters
 * @private
 */
class _StackFrame {
    /**
     * Whether this level of the stack is a loop.
     */
    isLoop = false;
    /**
     * Reported value from just executed block.
     */
    justReported: unknown = null;
    /**
     * The active block that is waiting on a promise.
     */
    reporting = '';
    /**
     * Persists reported inputs during async block.
     */
    reported: Record<string, unknown> | null = null;
    /**
     * Whether is waiting a custom reporter.
     */
    waitingReporter = false;
    /**
     * Procedure parameters.
     */
    params: Record<string, unknown> | null = null;
    /**
     * A context passed to block implementations.
     */
    executionContext: unknown = null;
    /**
     * The target of blocks that this thread will execute.
     */
    target: RenderedTarget | null = null;

    /**
     * @param warpMode Whether this level is in warp mode.  Is set by some legacy blocks and
     * "turbo mode"
     */
    constructor (public warpMode: boolean) {}

    /**
     * Reset all properties of the frame to pristine null and false states.
     * Used to recycle.
     */
    reset (): this {
        this.isLoop = false;
        this.warpMode = false;
        this.justReported = null;
        this.reported = null;
        this.waitingReporter = false;
        this.params = null;
        this.executionContext = null;

        return this;
    }

    /**
     * Reuse an active stack frame in the stack.
     * @param warpMode defaults to current warpMode
     */
    reuse (warpMode: boolean = this.warpMode): this {
        this.reset();
        this.warpMode = Boolean(warpMode);
        return this;
    }

    /**
     * Create or recycle a stack frame object.
     * @param warpMode Enable warpMode on this frame.
     */
    static create (warpMode: boolean): _StackFrame {
        const stackFrame = _stackFrameFreeList.pop();
        if (typeof stackFrame !== 'undefined') {
            stackFrame.warpMode = Boolean(warpMode);
            return stackFrame;
        }
        return new _StackFrame(warpMode);
    }

    /**
     * Put a stack frame object into the recycle bin for reuse.
     * @param stackFrame The frame to reset and recycle.
     */
    static release (stackFrame: _StackFrame): void {
        if (typeof stackFrame !== 'undefined') {
            _stackFrameFreeList.push(stackFrame.reset());
        }
    }
}

const enum ThreadStatus {
    RUNNING = 0,
    PROMISE_WAIT = 1,
    YIELD = 2,
    YIELD_TICK = 3,
    DONE = 4
}

/**
 * A thread is a running stack context and all the metadata needed.
 */
class Thread {
    /**
     * ID of top block of the thread
     */
    topBlock: string | null;
    /**
     * Stack for the thread. When the sequencer enters a control structure,
     * the block is pushed onto the stack so we know where to exit.
     */
    stack: string[] = [];
    /**
     * Stack frames for the thread. Store metadata for the executing blocks.
     */
    stackFrames: _StackFrame[] = [];
    /**
     * Status of the thread, one of three states (below)
     */
    status: ThreadStatus = ThreadStatus.RUNNING;
    /**
     * Whether the thread is killed in the middle of execution.
     */
    isKilled = false;
    /**
     * Target of this thread.
     */
    target: RenderedTarget | null = null;
    /**
     * The Blocks this thread will execute.
     */
    blockContainer: Blocks | null = null;
    /**
     * Whether the thread requests its script to glow during this frame.
     */
    requestScriptGlowInFrame: boolean = false;
    /**
     * Which block ID should glow during this frame, if any.
     */
    blockGlowInFrame: string | null = null;
    /**
     * A timer for when the thread enters warp mode.
     * Substitutes the sequencer's count toward WORK_TIME on a per-thread basis.
     */
    warpTimer: Timer | null = null;
    justReported: unknown = null;
    /**
     * true if the script was activated by clicking on the stack
     */
    stackClick = false;
    /**
     * true if the script should update a monitor value
     */
    updateMonitor = false;
    /**
     * An option to forcely mention that a control flow has happened.
     */
    controlFlowed = false;

    constructor (firstBlock: string | null) {
        this.topBlock = firstBlock;
    }

    /**
     * Thread status for initialized or running thread.
     * This is the default state for a thread - execution should run normally,
     * stepping from block to block.
     */
    static get STATUS_RUNNING () {
        return ThreadStatus.RUNNING;
    }

    /**
     * Threads are in this state when a primitive is waiting on a promise;
     * execution is paused until the promise changes thread status.
     */
    static get STATUS_PROMISE_WAIT () {
        return ThreadStatus.PROMISE_WAIT;
    }

    /**
     * Thread status for yield.
     */
    static get STATUS_YIELD () {
        return ThreadStatus.YIELD;
    }

    /**
     * Thread status for a single-tick yield. This will be cleared when the
     * thread is resumed.
     */
    static get STATUS_YIELD_TICK () {
        return ThreadStatus.YIELD_TICK;
    }

    /**
     * Thread status for a finished/done thread.
     * Thread is in this state when there are no more blocks to execute.
     */
    static get STATUS_DONE () {
        return ThreadStatus.DONE;
    }

    /**
     * Push stack and update stack frames appropriately.
     * @param blockId Block ID to push to stack.
     * @param target New target context.
     */
    pushStack (blockId: string, target?: RenderedTarget): void {
        this.stack.push(blockId);
        // Push an empty stack frame, if we need one.
        // Might not, if we just popped the stack.
        if (this.stack.length > this.stackFrames.length) {
            const parent = this.stackFrames[this.stackFrames.length - 1];
            const stackFrame = _StackFrame.create(typeof parent !== 'undefined' && parent.warpMode);
            if (target) {
                stackFrame.target = target;
            } else if (parent) {
                stackFrame.target = parent.target;
            } else {
                stackFrame.target = this.target;
            }
            this.blockContainer = stackFrame.target!.blocks;
            this.stackFrames.push(stackFrame);
        }
    }

    /**
     * Reset the stack frame for use by the next block.
     * (avoids popping and re-pushing a new stack frame - keeps the warpmode the same
     * @param blockId Block ID to push to stack.
     */
    reuseStackForNextBlock (blockId: string): void {
        this.stack[this.stack.length - 1] = blockId;
        this.stackFrames[this.stackFrames.length - 1].reuse();
    }

    /**
     * Pop last block on the stack and its stack frame.
     * @returns Block ID popped from the stack.
     */
    popStack (): string | undefined {
        _StackFrame.release(this.stackFrames.pop()!);
        const stackFrame = this.peekStackFrame();
        if (stackFrame) {
            this.blockContainer = stackFrame.target!.blocks;
        }
        return this.stack.pop();
    }

    /**
     * Pop back down the stack frame until we hit a procedure call or the stack frame is emptied
     */
    stopThisScript (): void {
        let blockID = this.peekStack();
        while (blockID !== null) {
            const block = this.blockContainer!.getBlock(blockID);
            if (this.peekStackFrame()!.waitingReporter) {
                // cc - check if a reporter procedure is on the stack
                break;
            } else if (block && block.opcode === 'procedures_call') {
                // cc - prevent call command procedure repeatedly
                this.goToNextBlock();
                break;
            }
            this.popStack();
            blockID = this.peekStack();
        }

        this.controlFlowed = true;

        if (this.stack.length === 0) {
            // Clean up!
            this.requestScriptGlowInFrame = false;
            this.status = Thread.STATUS_DONE;
        }
    }

    /**
     * Get top stack item.
     * @returns Block ID on top of stack.
     */
    peekStack (): string | null {
        return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
    }

    /**
     * Get top stack frame.
     * @returns Last stack frame stored on this thread.
     */
    peekStackFrame (): _StackFrame | null {
        return this.stackFrames.length > 0 ? this.stackFrames[this.stackFrames.length - 1] : null;
    }

    /**
     * Get stack frame above the current top.
     * @returns Second to last stack frame stored on this thread.
     */
    peekParentStackFrame (): _StackFrame | null {
        return this.stackFrames.length > 1 ? this.stackFrames[this.stackFrames.length - 2] : null;
    }

    /**
     * Push a reported value to the parent of the current stack frame.
     * @param value Reported value to push.
     */
    pushReportedValue (value: unknown): void {
        this.justReported = typeof value === 'undefined' ? null : value;
    }

    /**
     * Initialize procedure parameters on this stack frame.
     */
    initParams (): void {
        const stackFrame = this.peekStackFrame();
        if (stackFrame && stackFrame.params === null) {
            stackFrame.params = {};
        }
    }

    /**
     * Add a parameter to the stack frame.
     * Use when calling a procedure with parameter values.
     * @param paramName Name of parameter.
     * @param value Value to set for parameter.
     */
    pushParam (paramName: string, value: unknown): void {
        const stackFrame = this.peekStackFrame()!;
        stackFrame.params![paramName] = value;
    }

    /**
     * Get a parameter at the lowest possible level of the stack.
     * @param paramName Name of parameter.
     * @returns value Value for parameter.
     */
    getParam (paramName: string): unknown {
        // cc - ignore the top stack's param, it's not used by current stack
        for (let i = this.stackFrames.length - 2; i >= 0; i--) {
            const frame = this.stackFrames[i];
            if (frame.params === null) {
                continue;
            }
            if (Object.prototype.hasOwnProperty.call(frame.params, paramName)) {
                return frame.params[paramName];
            }
            return null;
        }
        return null;
    }

    /**
     * Whether the current execution of a thread is at the top of the stack.
     * @returns True if execution is at top of the stack.
     */
    atStackTop (): boolean {
        return this.peekStack() === this.topBlock;
    }

    /**
     * Switch the thread to the next block at the current level of the stack.
     * For example, this is used in a standard sequence of blocks,
     * where execution proceeds from one block to the next.
     */
    goToNextBlock (): void {
        const nextBlockId = this.blockContainer!.getNextBlock(this.peekStack()!) as string;
        this.reuseStackForNextBlock(nextBlockId);
    }

    /**
     * Attempt to determine whether a procedure call is recursive,
     * by examining the stack.
     * @param procedureCode Procedure code of procedure being called.
     * @returns True if the call appears recursive.
     */
    isRecursiveCall (procedureCode: string): boolean {
        let callCount = 5; // Max number of enclosing procedure calls to examine.
        const sp = this.stack.length - 1;
        let flag = false;
        for (let i = sp - 1; i >= 0; i--) {
            let blockId = this.stack[i];
            // cc - that the flag is set means the stack has been checked, otherwise it should be checked first.
            if (!flag && this.stackFrames[i].waitingReporter) {
                blockId = this.stackFrames[i].reporting;
                flag = true;
                ++i;
            } else {
                flag = false;
            }
            const block = this.stackFrames[i].target!.blocks.getBlock(blockId);
            // cc - block maybe not exists when triggered in toolbox.
            if (block && block.opcode === 'procedures_call' &&
                block.mutation?.proccode === procedureCode) {
                return true;
            }
            if (--callCount < 0) return false;
        }
        return false;
    }
}

export default Thread;
