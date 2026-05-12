import MathUtil from '../util/math-util';
import type Runtime from '../engine/runtime';
import type RenderedTarget from '../sprites/rendered-target';

class Mouse {
    _x = 0;
    _y = 0;
    _clientX = 0;
    _clientY = 0;
    _scratchX = 0;
    _scratchY = 0;
    /**
     * Press state for [left, midlle, right]
     */
    _isDown: [boolean, boolean, boolean] = [false, false, false];
    constructor (
        /**
         * Reference to the owning Runtime.
         * Can be used, for example, to activate hats.
         */
        public runtime: Runtime
    ) {}

    /**
     * Activate "event_whenthisspriteclicked" hats.
     * @param target to trigger hats on.
     * @private
     */
    _activateClickHats (target: RenderedTarget) {
        // Activate both "this sprite clicked" and "stage clicked"
        // They were separated into two opcodes for labeling,
        // but should act the same way.
        // Intentionally not checking isStage to make it work when sharing blocks.
        // @todo the blocks should be converted from one to another when shared
        this.runtime.startHats('event_whenthisspriteclicked',
            null, target);
        this.runtime.startHats('event_whenstageclicked',
            null, target);
    }

    /**
     * Find a target by XY location
     * @param x X position to be sent to the renderer.
     * @param y Y position to be sent to the renderer.
     * @returns the target at that location
     * @private
     */
    _pickTarget (x: number, y: number) {
        if (this.runtime.renderer) {
            const drawableID = this.runtime.renderer.pick(x, y);
            for (let i = 0; i < this.runtime.targets.length; i++) {
                const target = this.runtime.targets[i] as RenderedTarget;
                if (Object.prototype.hasOwnProperty.call(target, 'drawableID') &&
                    target.drawableID === drawableID) {
                    return target;
                }
            }
        }
        // Return the stage if no target was found
        return this.runtime.getTargetForStage();
    }

    /**
     * Mouse DOM event handler.
     * @param data Data from DOM event.
     * @param data.x X position of the mouse relative to the canvas.
     * @param data.y Y position of the mouse relative to the canvas.
     * @param data.isDown Whether the mouse is down.
     * @param data.canvasWidth Width of the canvas, used for scaling mouse coordinates.
     * @param data.canvasHeight Height of the canvas, used for scaling mouse coordinates.
     * @param data.button Button number (0 for left, 1 for middle, 2 for right).
     * @param data.wasDragged Whether the mouse was dragged between the last mouse down and mouse up.
     *  Used to prevent click hats from activating after dragging.
     */
    postData (data: {
        x?: number;
        y?: number;
        isDown?: boolean;
        canvasWidth: number;
        canvasHeight: number;
        button: number;
        wasDragged?: boolean;
    }) {
        const halfWidth = this.runtime.stageWidth / 2;
        const halfHeight = this.runtime.stageHeight / 2;
        if (data.x) {
            this._clientX = data.x;
            this._scratchX = MathUtil.clamp(
                this.runtime.stageWidth * ((data.x / data.canvasWidth) - 0.5),
                -halfWidth,
                halfWidth
            );
        }
        if (data.y) {
            this._clientY = data.y;
            this._scratchY = MathUtil.clamp(
                -this.runtime.stageHeight * ((data.y / data.canvasHeight) - 0.5),
                -halfHeight,
                halfHeight
            );
        }
        if (typeof data.isDown !== 'undefined') {
            const previousDownState = this._isDown[data.button];
            this._isDown[data.button] = data.isDown;

            // Do not trigger if down state has not changed
            if (previousDownState === this._isDown[data.button]) return;

            // Never trigger click hats at the end of a drag
            if (data.wasDragged) return;

            // Do not activate click hats for clicks outside canvas bounds
            if (!(data.x! > 0 && data.x! < data.canvasWidth &&
                data.y! > 0 && data.y! < data.canvasHeight)) return;

            const target = this._pickTarget(data.x!, data.y!);
            if (!target) return;
            const isNewMouseDown = !previousDownState && data.isDown;
            const isNewMouseUp = previousDownState && !data.isDown;

            // Draggable targets start click hats on mouse up.
            // Non-draggable targets start click hats on mouse down.
            if (target.draggable && isNewMouseUp) {
                this._activateClickHats(target);
            } else if (!target.draggable && isNewMouseDown) {
                this._activateClickHats(target);
            }
        }
    }

    /**
     * Get the X position of the mouse in client coordinates.
     * @returns Non-clamped X position of the mouse cursor.
     */
    getClientX (): number {
        return this._clientX;
    }

    /**
     * Get the Y position of the mouse in client coordinates.
     * @returns Non-clamped Y position of the mouse cursor.
     */
    getClientY (): number {
        return this._clientY;
    }

    /**
     * Get the X position of the mouse in scratch coordinates.
     * @returns Clamped and integer rounded X position of the mouse cursor.
     */
    getScratchX (): number {
        return this.runtime.limitOptions.accurateCoordinates ?
            this._scratchX : Math.round(this._scratchX);
    }

    /**
     * Get the Y position of the mouse in scratch coordinates.
     * @returns Clamped and integer rounded Y position of the mouse cursor.
     */
    getScratchY (): number {
        return this.runtime.limitOptions.accurateCoordinates ?
            this._scratchY : Math.round(this._scratchY);
    }

    /**
     * Get the down state of the mouse.
     * @returns Is the mouse down?
     */
    getIsDown (): boolean {
        return this._isDown[0];
    }

    /**
     * Get the down state of the mouse.
     * @param button Button number.
     * @returns Is the mouse down?
     */
    getMousePressed (button: number): boolean {
        return this._isDown[button];
    }
}

export default Mouse;
