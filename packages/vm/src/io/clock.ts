import Timer from '../util/timer';
import type Runtime from '../engine/runtime';

class Clock {
    _projectTimer: Timer;
    _pausedTime: number | null = null;
    _paused = false;

    constructor (
        /**
         * Reference to the owning Runtime.
         */
        public runtime: Runtime
    ) {
        this._projectTimer = new Timer({now: () => runtime.currentMSecs});
        this._projectTimer.start();
    }

    projectTimer (): number {
        if (this._paused) {
            return this._pausedTime! / 1000;
        }
        return this._projectTimer.timeElapsed() / 1000;
    }

    pause () {
        this._paused = true;
        this._pausedTime = this._projectTimer.timeElapsed();
    }

    resume () {
        this._paused = false;
        const dt = this._projectTimer.timeElapsed() - this._pausedTime!;
        this._projectTimer.startTime += dt;
    }

    resetProjectTimer () {
        this._projectTimer.start();
    }
}

export default Clock;
