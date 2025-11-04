/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

/** Get the constructor type of given type. It will erase typings of constructor arguments. */
export type Constructor<T, Args extends any[] = any[]> = new (...args: Args) => T;
