export type MemberFunc<T> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [K in keyof T]: T[K] extends (...args: any[]) => unknown ? K : never;
}[keyof T];
