/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * Create a new type that overrides properties in T with properties from U.
 * @typeParam T - The original object type.
 * @typeParam U - The type containing properties to override, which should only
 *      contains keys existing in T.
 */
export type Modify<T, U> = Required<T> extends {[K in keyof U]: any}
    ? Omit<T, keyof U> & U
    : never;

/**
 * Create a new type that mark specified properties in T optional. It is useful
 * when creating a function that initialized a interface.
 * @typeParam T - The original object type.
 * @typeParam K - Keys that needs to be marked optional in T.
 */
export type PartialKeys<T, K extends keyof T> = Omit<T, K> & {
    [I in K]?: T[I]
};

/**
 * Create a new type that mark specified properties in T required.
 * @typeParam T - The original object type.
 * @typeParam K - Keys that needs to be marked required in T.
 */
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> & {
    [I in K]-?: T[I]
};
