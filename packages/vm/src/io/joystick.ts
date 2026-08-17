import type Runtime from '../engine/runtime';

class Joystick {
    _x = 0;
    _y = 0;
    _distance = 0;

    constructor (
        /**
         * Reference to the owning Runtime.
         * Can be used, for example, to activate hats.
         */
        public runtime: Runtime
    ) {}

    postData (data: Record<string, number>) {
        if (Object.prototype.hasOwnProperty.call(data, 'x')) this._x = data.x;
        if (Object.prototype.hasOwnProperty.call(data, 'y')) this._y = data.y;
        if (Object.prototype.hasOwnProperty.call(data, 'distance')) this._distance = data.distance;
    }

    getX (): number {
        return this._x;
    }

    getY (): number {
        return this._y;
    }

    getDistance (): number {
        return this._distance;
    }
}

export default Joystick;
