export type BaseAction<T extends string = string> = {
    type: T;
};

export type Point = {
    x: number;
    y: number;
};
