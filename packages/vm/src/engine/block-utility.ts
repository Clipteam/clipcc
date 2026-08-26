import Thread from './thread';
import Timer from '../util/timer';
import type Sequencer from './sequencer';
import type Runtime from './runtime';
import type Target from './target';
import type {MemberFunc} from '../util/type-traits';

export interface BaseExecutionContext {
    [key: string]: unknown;
}

interface StackTimerContext {
    timer: Timer;
    duration: number;
    endX?: number;
    endY?: number;
    startX?: number;
    startY?: number;
}

type AvailableIODevices = keyof Runtime['ioDevices'];

type ExecutionContext = BaseExecutionContext & Partial<StackTimerContext>;

/**
 * @fileoverview
 * Interface provided to block primitive functions for interacting with the
 * runtime, thread, target, and convenient methods.
 */

type NowObj = { now: () => number };

class BlockUtility {
    /**
     * A sequencer block primitives use to branch or start procedures with
     */
    sequencer: Sequencer | null;

    /**
     * The block primitives thread with the block's target, stackFrame and
     * modifiable status.
     */
    thread: Thread | null;

    _nowObj: NowObj;

    /**
     * The opcode to skip to, which is used to implement short-circuit evaluation.
     */
    skipToOpcode: string | boolean | null = null;

    constructor (sequencer: Sequencer | null = null, thread: Thread | null = null) {
        this.sequencer = sequencer;

        this.thread = thread;

        this._nowObj = {
            now: () => this.sequencer!.runtime.currentMSecs
        };
    }

    /**
     * The target the primitive is working on.
     */
    get target (): Target {
        return this.thread!.target!;
    }

    /**
     * The runtime the block primitive is running in.
     */
    get runtime (): Runtime | undefined {
        return this.sequencer?.runtime;
    }

    /**
     * Use the runtime's currentMSecs value as a timestamp value for now
     * This is useful in some cases where we need compatibility with Scratch 2
     */
    get nowObj (): NowObj | null {
        if (this.runtime) {
            return this._nowObj;
        }
        return null;
    }

    /**
     * The stack frame used by loop and other blocks to track internal state.
     */
    get stackFrame (): ExecutionContext {
        const frame = this.thread!.peekStackFrame();
        if (frame!.executionContext === null) {
            frame!.executionContext = {};
        }
        return frame!.executionContext as ExecutionContext;
    }

    /**
     * Check the stack timer and return a boolean based on whether it has finished or not.
     * @returns true if the stack timer has finished.
     */
    stackTimerFinished (): boolean {
        if (!this.stackTimerAvailable(this.stackFrame)) {
            throw new Error('No stack timer found when checking if stack timer is finished');
        }
        const timeElapsed = this.stackFrame.timer.timeElapsed();
        if (timeElapsed < this.stackFrame.duration) {
            return false;
        }
        return true;
    }

    stackTimerAvailable (ctx: ExecutionContext): ctx is BaseExecutionContext & StackTimerContext {
        return !!ctx.timer;
    }

    /**
     * Check if the stack timer needs initialization.
     * @returns true if the stack timer needs to be initialized.
     */
    stackTimerNeedsInit (): boolean {
        return !this.stackFrame.timer;
    }

    /**
     * Create and start a stack timer
     * @param duration - a duration in milliseconds to set the timer for.
     */
    startStackTimer (duration: number): void {
        if (this.nowObj) {
            this.stackFrame.timer = new Timer(this.nowObj);
        } else {
            this.stackFrame.timer = new Timer();
        }
        this.stackFrame.timer.start();
        this.stackFrame.duration = duration;
    }

    /**
     * Set the thread to yield.
     */
    yield (): void {
        this.thread!.status = Thread.STATUS_YIELD;
    }

    /**
     * Set the thread to yield until the next tick of the runtime.
     */
    yieldTick (): void {
        this.thread!.status = Thread.STATUS_YIELD_TICK;
    }

    /**
     * Start a branch in the current block.
     * @param branchNum Which branch to step to (i.e., 1, 2).
     * @param isLoop Whether this block is a loop.
     */
    startBranch (branchNum: number, isLoop: boolean): void {
        this.sequencer!.stepToBranch(this.thread!, branchNum, isLoop);
    }

    /**
     * Stop all threads.
     */
    stopAll (): void {
        this.sequencer!.runtime.stopAll();
    }

    /**
     * Stop threads other on this target other than the thread holding the
     * executed block.
     */
    stopOtherTargetThreads (): void {
        this.sequencer!.runtime.stopForTarget(this.thread!.target!, this.thread!);
    }

    /**
     * Stop this thread.
     */
    stopThisScript (): void {
        this.thread!.stopThisScript();
    }

    /**
     * Start a specified procedure on this thread.
     * @param procedureCode Procedure code for procedure to start.
     */
    startProcedure (procedureCode: string): void {
        this.sequencer!.stepToProcedure(this.thread!, procedureCode);
    }

    /**
     * Get names and ids of parameters for the given procedure.
     * @param procedureCode Procedure code for procedure to query.
     * @returns List of param names for a procedure.
     */
    getProcedureParamNamesAndIds (procedureCode: string) {
        const result = this.thread!.blockContainer!.getProcedureParamNamesAndIds(procedureCode);
        if (result) {
            return result;
        }
        return this.sequencer!.runtime.getProcedureParamNamesAndIds(procedureCode);
    }

    /**
     * Get names, ids, and defaults of parameters for the given procedure.
     * @param procedureCode Procedure code for procedure to query.
     * @returns List of param names for a procedure.
     */
    getProcedureParamNamesIdsAndDefaults (procedureCode: string) {
        const result = this.thread!.blockContainer!.getProcedureParamNamesIdsAndDefaults(procedureCode);
        if (result) {
            return result;
        }
        return this.sequencer!.runtime.getProcedureParamNamesIdsAndDefaults(procedureCode);
    }

    /**
     * Initialize procedure parameters in the thread before pushing parameters.
     */
    initParams (): void {
        this.thread!.initParams();
    }

    /**
     * Store a procedure parameter value by its name.
     * @param paramName The procedure's parameter name.
     * @param paramValue The procedure's parameter value.
     */
    pushParam (paramName: string, paramValue: unknown): void {
        this.thread!.pushParam(paramName, paramValue);
    }

    /**
     * Retrieve the stored parameter value for a given parameter name.
     * @param paramName The procedure's parameter name.
     * @returns The parameter's current stored value.
     */
    getParam (paramName: string): unknown {
        return this.thread!.getParam(paramName);
    }

    /**
     * Start all relevant hats.
     * @param requestedHat Opcode of hats to start.
     * @param optMatchFields Optionally, fields to match on the hat.
     * @param optTarget Optionally, a target to restrict to.
     * @returns List of threads started by this function.
     */
    startHats (requestedHat: string, optMatchFields?: object, optTarget?: Target) {
        // Store thread and sequencer to ensure we can return to the calling block's context.
        // startHats may execute further blocks and dirty the BlockUtility's execution context
        // and confuse the calling block when we return to it.
        const callerThread = this.thread;
        const callerSequencer = this.sequencer;
        const result = this.sequencer!.runtime.startHats(requestedHat, optMatchFields, optTarget);

        // Restore thread and sequencer to prior values before we return to the calling block.
        this.thread = callerThread;
        this.sequencer = callerSequencer;

        return result;
    }

    /**
     * Query a named IO device.
     * @param device The name of like the device, like keyboard.
     * @param func The name of the device's function to query.
     * @param args Arguments to pass to the device's function.
     * @returns The expected output for the device's function.
     */
    ioQuery<T extends AvailableIODevices, U extends MemberFunc<Runtime['ioDevices'][T]>> (
        device: T,
        func: U,
        args?: Runtime['ioDevices'][T][U] extends (...args: infer P) => unknown ? P : never
    ) {
        const ioDevices = this.sequencer!.runtime.ioDevices;
        if (device in ioDevices && func in ioDevices[device]) {
            const devObject = ioDevices[device];
            /* eslint-disable prefer-spread */
            // @ts-expect-error yeah but tsc is dumb here, so we handle it by ourselves.
            return devObject[func].apply(devObject, args) as ReturnType<Runtime['ioDevices'][T][U]>;
            /* eslint-enable prefer-spread */
        }
        // @ts-expect-error if we're in ts env, it never get triggered. just make tsc happy.
        return null as ReturnType<Runtime['ioDevices'][T][U]>;
    }
}

export default BlockUtility;
