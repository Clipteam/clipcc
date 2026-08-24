/**
 * Extracts the keys whose values are callable functions from a type.
 * @template T - The type to extract callable keys from.
 * @returns A union of keys from T whose values are callable functions.
 */
export type MemberFunc<T> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [K in keyof T]: T[K] extends (...args: any[]) => unknown ? K : never;
}[keyof T];
