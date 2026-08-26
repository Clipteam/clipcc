// @ts-nocheck
import Cast from '../util/cast';
import type {BlockArgs, CategoryPrototype} from './category_prototype';
import type Runtime from '../engine/runtime';
import type BlockUtility from '../engine/block-utility';
import type Thread from '../engine/thread';
import type {BaseExecutionContext} from '../engine/block-utility';
import type Variable from '../engine/variable';

interface EventExecutionContext extends BaseExecutionContext {
    broadcastVar?: Variable;
    startedThreads?: Thread[];
}

class Scratch3EventBlocks implements CategoryPrototype {
    constructor (
        /**
         * The runtime instantiating this block package.
         */
        public runtime: Runtime
    ) {
        this.runtime.on('KEY_PRESSED', key => {
            this.runtime.startHats('event_whenkeypressed', {
                KEY_OPTION: key
            });
            this.runtime.startHats('event_whenkeypressed', {
                KEY_OPTION: 'any'
            });
        });
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @returns Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            event_whentouchingobject: this.touchingObject,
            event_broadcast: this.broadcast,
            event_broadcastandwait: this.broadcastAndWait,
            event_whengreaterthan: this.hatGreaterThanPredicate
        };
    }

    getHats () {
        return {
            event_whenflagclicked: {
                restartExistingThreads: true
            },
            event_whenkeypressed: {
                restartExistingThreads: false
            },
            event_whenthisspriteclicked: {
                restartExistingThreads: true
            },
            event_whentouchingobject: {
                restartExistingThreads: false,
                edgeActivated: true
            },
            event_whenstageclicked: {
                restartExistingThreads: true
            },
            event_whenbackdropswitchesto: {
                restartExistingThreads: true
            },
            event_whengreaterthan: {
                restartExistingThreads: false,
                edgeActivated: true
            },
            event_whenbroadcastreceived: {
                restartExistingThreads: true
            }
        };
    }

    touchingObject (args: BlockArgs, util: BlockUtility) {
        return util.target.isTouchingObject(args.TOUCHINGOBJECTMENU);
    }

    hatGreaterThanPredicate (args: BlockArgs, util: BlockUtility) {
        const option = Cast.toString(args.WHENGREATERTHANMENU).toLowerCase();
        const value = Cast.toNumber(args.VALUE);
        switch (option) {
        case 'timer':
            return util.ioQuery('clock', 'projectTimer') > value;
        case 'loudness':
            return this.runtime.audioEngine && this.runtime.audioEngine.getLoudness() > value;
        }
        return false;
    }

    broadcast (args: BlockArgs, util: BlockUtility) {
        const broadcastVar = util.runtime!.getTargetForStage()?.lookupBroadcastMsg(
            args.BROADCAST_OPTION.id, args.BROADCAST_OPTION.name);
        if (broadcastVar) {
            const broadcastOption = broadcastVar.name;
            util.startHats('event_whenbroadcastreceived', {
                BROADCAST_OPTION: broadcastOption
            });
        }
    }

    broadcastAndWait (args: BlockArgs, util: BlockUtility) {
        if (!util.stackFrame.broadcastVar) {
            util.stackFrame.broadcastVar = util.runtime!.getTargetForStage()?.lookupBroadcastMsg(
                args.BROADCAST_OPTION.id, args.BROADCAST_OPTION.name);
        }
        if (util.stackFrame.broadcastVar) {
            const broadcastOption = (util.stackFrame as EventExecutionContext).broadcastVar!.name;
            // Have we run before, starting threads?
            if (!util.stackFrame.startedThreads) {
                // No - start hats for this broadcast.
                util.stackFrame.startedThreads = util.startHats(
                    'event_whenbroadcastreceived', {
                        BROADCAST_OPTION: broadcastOption
                    }
                );
                if ((util.stackFrame as EventExecutionContext).startedThreads?.length === 0) {
                    // Nothing was started.
                    return;
                }
            }
            // We've run before; check if the wait is still going on.
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const instance = this;
            // Scratch 2 considers threads to be waiting if they are still in
            // runtime.threads. Threads that have run all their blocks, or are
            // marked done but still in runtime.threads are still considered to
            // be waiting.
            const waiting = (util.stackFrame.startedThreads as Thread[])
                .some(thread => instance.runtime.threads.indexOf(thread) !== -1);
            if (waiting) {
                // If all threads are waiting for the next tick or later yield
                // for a tick as well. Otherwise yield until the next loop of
                // the threads.
                if (
                    (util.stackFrame.startedThreads as Thread[])
                        .every(thread => instance.runtime.isWaitingThread(thread))
                ) {
                    util.yieldTick();
                } else {
                    util.yield();
                }
            }
        }
    }
}

export default Scratch3EventBlocks;
