import log from '../lib/log';
import type {AnyAction} from 'redux';
import {isAction, type BaseAction, type Point} from './common';

const ADD_MONITOR_RECT = 'scratch-gui/monitors/ADD_MONITOR_RECT';
const MOVE_MONITOR_RECT = 'scratch-gui/monitors/MOVE_MONITOR_RECT';
const RESIZE_MONITOR_RECT = 'scratch-gui/monitors/RESIZE_MONITOR_RECT';
const REMOVE_MONITOR_RECT = 'scratch-gui/monitors/REMOVE_MONITOR_RECT';

interface Rect {
    upperStart: Point;
    lowerEnd: Point;
};

export interface MonitorLayoutState {
    monitors: Record<string, Rect>;
    savedMonitorPositions: Record<string, Point>;
};

const initialState: MonitorLayoutState = {
    monitors: {},
    savedMonitorPositions: {}
};

interface AddMonitorRectAction extends BaseAction<typeof ADD_MONITOR_RECT> {
    monitorId: string;
    upperStart: Point;
    lowerEnd: Point;
    savePosition?: boolean;
};

interface MoveMonitorRectAction extends BaseAction<typeof MOVE_MONITOR_RECT> {
    monitorId: string;
    newX: number;
    newY: number;
};

interface ResizeMonitorRectAction extends BaseAction<typeof RESIZE_MONITOR_RECT> {
    monitorId: string;
    newWidth: number;
    newHeight: number;
};

interface RemoveMonitorRectAction extends BaseAction<typeof REMOVE_MONITOR_RECT> {
    monitorId: string;
};

// Verify that the rectangle formed by the 2 points is well-formed
const _verifyRect = function (upperStart: Point, lowerEnd: Point): boolean {
    if (isNaN(upperStart.x) || isNaN(upperStart.y) || isNaN(lowerEnd.x) || isNaN(lowerEnd.y)) {
        return false;
    }
    if (!(upperStart.x < lowerEnd.x)) {
        return false;
    }
    if (!(upperStart.y < lowerEnd.y)) {
        return false;
    }
    return true;
};

const _addMonitorRect = function (state: MonitorLayoutState, action: AddMonitorRectAction): MonitorLayoutState {
    if (Object.prototype.hasOwnProperty.call(state.monitors, action.monitorId)) {
        log.error(`Can't add monitor, monitor with id ${action.monitorId} already exists.`);
        return state;
    }
    if (!_verifyRect(action.upperStart, action.lowerEnd)) {
        log.error('Monitor rectangle not formatted correctly');
        return state;
    }
    return {
        monitors: Object.assign({}, state.monitors, {
            [action.monitorId]: {
                upperStart: action.upperStart,
                lowerEnd: action.lowerEnd
            }
        }),
        savedMonitorPositions: action.savePosition ?
            Object.assign({}, state.savedMonitorPositions, {
                [action.monitorId]: {x: action.upperStart.x, y: action.upperStart.y}
            }) :
            state.savedMonitorPositions
    };
};

const _moveMonitorRect = function (state: MonitorLayoutState, action: MoveMonitorRectAction): MonitorLayoutState {
    if (!Object.prototype.hasOwnProperty.call(state.monitors, action.monitorId)) {
        log.error(`Can't move monitor, monitor with id ${action.monitorId} does not exist.`);
        return state;
    }
    if (isNaN(action.newX) || isNaN(action.newY)) {
        log.error('Monitor rectangle not formatted correctly');
        return state;
    }

    const oldMonitor = state.monitors[action.monitorId];
    if (oldMonitor.upperStart.x === action.newX &&
            oldMonitor.upperStart.y === action.newY) {
        // Hasn't moved
        return state;
    }
    const monitorWidth = oldMonitor.lowerEnd.x - oldMonitor.upperStart.x;
    const monitorHeight = oldMonitor.lowerEnd.y - oldMonitor.upperStart.y;
    return {
        monitors: Object.assign({}, state.monitors, {
            [action.monitorId]: {
                upperStart: {x: action.newX, y: action.newY},
                lowerEnd: {x: action.newX + monitorWidth, y: action.newY + monitorHeight}
            }
        }),
        // User generated position is saved
        savedMonitorPositions: Object.assign({}, state.savedMonitorPositions, {
            [action.monitorId]: {x: action.newX, y: action.newY}
        })
    };
};

const _resizeMonitorRect = function (state: MonitorLayoutState, action: ResizeMonitorRectAction): MonitorLayoutState {
    if (!Object.prototype.hasOwnProperty.call(state.monitors, action.monitorId)) {
        log.error(`Can't resize monitor, monitor with id ${action.monitorId} does not exist.`);
        return state;
    }
    if (isNaN(action.newWidth) || isNaN(action.newHeight) ||
            action.newWidth <= 0 || action.newHeight <= 0) {
        log.error('Monitor rectangle not formatted correctly');
        return state;
    }

    const oldMonitor = state.monitors[action.monitorId];
    const newMonitor: Rect = {
        upperStart: oldMonitor.upperStart,
        lowerEnd: {
            x: oldMonitor.upperStart.x + action.newWidth,
            y: oldMonitor.upperStart.y + action.newHeight
        }
    };
    if (newMonitor.lowerEnd.x === oldMonitor.lowerEnd.x &&
            newMonitor.lowerEnd.y === oldMonitor.lowerEnd.y) {
        // no change
        return state;
    }

    return {
        monitors: Object.assign({}, state.monitors, {[action.monitorId]: newMonitor}),
        savedMonitorPositions: state.savedMonitorPositions
    };

};

const _removeMonitorRect = function (state: MonitorLayoutState, action: RemoveMonitorRectAction): MonitorLayoutState {
    if (!Object.prototype.hasOwnProperty.call(state.monitors, action.monitorId)) {
        log.error(`Can't remove monitor, monitor with id ${action.monitorId} does not exist.`);
        return state;
    }

    const newMonitors = Object.assign({}, state.monitors);
    delete newMonitors[action.monitorId];
    return {
        monitors: newMonitors,
        savedMonitorPositions: state.savedMonitorPositions
    };
};

const reducer = function (state: MonitorLayoutState = initialState, action: AnyAction): MonitorLayoutState {
    if (typeof state === 'undefined') state = initialState;
    if (isAction<AddMonitorRectAction>(action, ADD_MONITOR_RECT)) return _addMonitorRect(state, action);
    if (isAction<MoveMonitorRectAction>(action, MOVE_MONITOR_RECT)) return _moveMonitorRect(state, action);
    if (isAction<ResizeMonitorRectAction>(action, RESIZE_MONITOR_RECT)) return _resizeMonitorRect(state, action);
    if (isAction<RemoveMonitorRectAction>(action, REMOVE_MONITOR_RECT)) return _removeMonitorRect(state, action);
    return state;
};

// Init position --------------------------
const PADDING = 5;
// @todo fix these numbers when we fix https://github.com/LLK/scratch-gui/issues/980
const SCREEN_WIDTH = 400;
const SCREEN_HEIGHT = 300;
const SCREEN_EDGE_BUFFER = 40;

const _rectsIntersect = function (rect1: Rect, rect2: Rect): boolean {
    // If one rectangle is on left side of other
    if (rect1.upperStart.x >= rect2.lowerEnd.x || rect2.upperStart.x >= rect1.lowerEnd.x) return false;
    // If one rectangle is above other
    if (rect1.upperStart.y >= rect2.lowerEnd.y || rect2.upperStart.y >= rect1.lowerEnd.y) return false;
    return true;
};

// We need to place a monitor with the given width and height. Return a rect defining where it should be placed.
function getInitialPosition (state: MonitorLayoutState, monitorId: string, eltWidth: number, eltHeight: number): Rect {
    // If this monitor was purposefully moved to a certain position before, put it back in that position
    if (Object.prototype.hasOwnProperty.call(state.savedMonitorPositions, monitorId)) {
        const saved = state.savedMonitorPositions[monitorId];
        return {
            upperStart: saved,
            lowerEnd: {x: saved.x + eltWidth, y: saved.y + eltHeight}
        };
    }

    // Try all starting positions for the new monitor to find one that doesn't intersect others
    const endXs = [0];
    const endYs = [0];
    let lastX: number | null = null;
    let lastY: number | null = null;
    for (const monitor in state.monitors) {
        let x = state.monitors[monitor].lowerEnd.x;
        x = Math.ceil(x / 50) * 50; // Try to choose a sensible "tab width" so more monitors line up
        endXs.push(x);
        endYs.push(Math.ceil(state.monitors[monitor].lowerEnd.y));
    }
    endXs.sort((a, b) => a - b);
    endYs.sort((a, b) => a - b);
    // We'll use plan B if the monitor doesn't fit anywhere (too long or tall)
    let planB: Rect | null = null;
    for (const x of endXs) {
        if (x === lastX) {
            continue;
        }
        lastX = x;
        outer:
        for (const y of endYs) {
            if (y === lastY) {
                continue;
            }
            lastY = y;
            const monitorRect = {
                upperStart: {x: x + PADDING, y: y + PADDING},
                lowerEnd: {x: x + PADDING + eltWidth, y: y + PADDING + eltHeight}
            };
            // Intersection testing rect that includes padding
            const rect = {
                upperStart: {x, y},
                lowerEnd: {x: x + eltWidth + (2 * PADDING), y: y + eltHeight + (2 * PADDING)}
            };
            for (const monitor in state.monitors) {
                if (_rectsIntersect(state.monitors[monitor], rect)) {
                    continue outer;
                }
            }
            // If the rect overlaps the ends of the screen
            if (rect.lowerEnd.x > SCREEN_WIDTH || rect.lowerEnd.y > SCREEN_HEIGHT) {
                // If rect is not too close to completely off screen, set it as plan B
                if (!planB &&
                        !(rect.upperStart.x + SCREEN_EDGE_BUFFER > SCREEN_WIDTH ||
                            rect.upperStart.y + SCREEN_EDGE_BUFFER > SCREEN_HEIGHT)) {
                    planB = monitorRect;
                }
                continue;
            }
            return monitorRect;
        }
    }
    // If the monitor is too long to fit anywhere, put it in the leftmost spot available
    // that intersects the right or bottom edge and isn't too close to the edge.
    if (planB) {
        return planB;
    }

    // If plan B fails and there's nowhere reasonable to put it, plan C is to place the monitor randomly
    const randX = Math.ceil(Math.random() * (SCREEN_WIDTH / 2));
    const randY = Math.ceil(Math.random() * (SCREEN_HEIGHT - SCREEN_EDGE_BUFFER));
    return {
        upperStart: {
            x: randX,
            y: randY
        },
        lowerEnd: {
            x: randX + eltWidth,
            y: randY + eltHeight
        }
    };
};

// Action creators ------------------------
/**
 * Add a monitor with the given id and rectangle. If savePosition is true,
 * this position will be saved as the default for this monitor id and used as the initial position when
 * adding monitors with this id in the future.
 * @param monitorId Id to add
 * @param upperStart upper point defining the rectangle
 * @param upperStart.x X of top point that defines the monitor location
 * @param upperStart.y Y of top point that defines the monitor location
 * @param lowerEnd lower point defining the rectangle
 * @param lowerEnd.x X of bottom point that defines the monitor location
 * @param lowerEnd.y Y of bottom point that defines the monitor location
 * @param savePosition True if the placement should be saved when adding the monitor
 * @returns action to add a new monitor at the location
 */
function addMonitorRect (
    monitorId: string,
    upperStart: Point,
    lowerEnd: Point,
    savePosition?: boolean
): AddMonitorRectAction {
    return {
        type: ADD_MONITOR_RECT,
        monitorId: monitorId,
        upperStart: upperStart,
        lowerEnd: lowerEnd,
        savePosition: savePosition
    };
};

/**
 * Get the initial position for a monitor with the given id and dimensions. If the monitor has been placed before and
 * savePosition was true, this will return the saved position. Otherwise, it will return a position that doesn't
 * intersect with any existing monitors if possible, or a random position if not.
 * @param monitorId Id for monitor to move
 * @param newX X of top point that defines the monitor location
 * @param newY Y of top point that defines the monitor location
 * @returns action to move an existing monitor to the location
 */
const moveMonitorRect = function (monitorId: string, newX: number, newY: number): MoveMonitorRectAction {
    return {
        type: MOVE_MONITOR_RECT,
        monitorId: monitorId,
        newX: newX,
        newY: newY
    };
};

/**
 * Get the initial position for a monitor with the given id and dimensions. If the monitor has been placed before and
 * @param monitorId Id for monitor to resize
 * @param newWidth Width to set monitor to
 * @param newHeight Height to set monitor to
 * @returns action to resize an existing monitor to the given dimensions
 */
const resizeMonitorRect = function (monitorId: string, newWidth: number, newHeight: number): ResizeMonitorRectAction {
    return {
        type: RESIZE_MONITOR_RECT,
        monitorId: monitorId,
        newWidth: newWidth,
        newHeight: newHeight
    };
};

/**
 * Remove the monitor with the given id.
 * @param monitorId Id for monitor to remove
 * @returns action to remove an existing monitor
 */
const removeMonitorRect = function (monitorId: string): RemoveMonitorRectAction {
    return {
        type: REMOVE_MONITOR_RECT,
        monitorId: monitorId
    };
};

export {
    reducer as default,
    initialState as monitorLayoutInitialState,
    addMonitorRect,
    getInitialPosition,
    moveMonitorRect,
    resizeMonitorRect,
    removeMonitorRect,
    PADDING,
    SCREEN_HEIGHT,
    SCREEN_WIDTH
};
