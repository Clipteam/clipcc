import type {AnyAction} from 'redux';

export type BaseAction<T extends string = string> = {
    type: T;
};

export type Point = {
    x: number;
    y: number;
};

export function isAction<T extends BaseAction> (action: AnyAction, type: string): action is T {
    return action.type === type;
}
