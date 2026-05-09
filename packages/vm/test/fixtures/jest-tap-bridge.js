/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MIT
 */

/**
 * @fileoverview A bridge to make old tap tests run under jest environment
 * seamlessly.  Mimics a subset of the {@link https://node-tap.org/ node-tap}
 * assertion API, delegating each assertion to Jest's `expect()`.
 */

// Use tap's default timeout of 30s for all tests run via bridge.
jest.setTimeout(30000);

/**
 * @typedef {object} TapAssertions
 * @property {(n: number) => void} plan
 *   Specify the number of Test Points expected by this test.
 * @property {() => void} end
 *   Explicitly mark the test as completed.
 * @property {(actual: unknown, expected: unknown) => void} equal
 *   Verify that the values are equal (loose `==`).
 * @property {(actual: unknown, expected: unknown) => void} same
 *   Verify that the value is loosely equivalent to the supplied pattern.
 * @property {(actual: unknown, expected: unknown) => void} strictSame
 *   Verify that the value is strictly equivalent to the supplied pattern.
 * @property {(actual: unknown, expected: unknown) => void} not
 *   Verify that the values are not equal (loose `!=`).
 * @property {(actual: unknown, expected: unknown) => void} strictNotSame
 *   Verify that the value is not strictly equivalent to the supplied pattern.
 * @property {(value: unknown) => void} ok
 *   Verify that the value is truthy.
 * @property {(value: unknown) => void} notOk
 *   Verify that the value is not truthy.
 * @property {(value: unknown, typeStr: string) => void} type
 *   Verify that the value is of the type specified.
 * @property {(fn: Function, expectedError?: Error|RegExp|string|Function) => void} throws
 *   Verify that the function throws an error.
 * @property {(fn: Function) => void} doesNotThrow
 *   Assert that the function does not throw.
 * @property {(message?: string|Error) => void} fail
 *   A failing (not ok) Test Point.
 * @property {(message?: string) => void} pass
 *   A passing (ok) Test Point.
 * @property {(...args: unknown[]) => void} comment
 *   Output a TAP comment, formatted like `console.log()`.
 * @property {(name: string, fn: (t: TapAssertions) => void|Promise<void>) => Promise<void>} test
 *   Create a child test.
 */

/**
 * @callback TapTestFn
 * @param {TapAssertions} t
 * @returns {void|Promise<void>}
 */

/**
 * @typedef {object} TapBridge
 * @property {(name: string, fn: TapTestFn) => void} test
 *   Register a test case.
 * @property {(name: string, fn: TapTestFn) => void} Test
 *   Alias for {@link TapBridge#test}.
 * @property {(fn: () => void) => void} beforeEach
 *   Register a beforeEach hook via Jest's `beforeEach`.
 */

/**
 * Normalize values for TAP-compatible comparison.
 * `-0` is normalized to `0` (TAP treats them as equal).
 * @param {unknown} val
 * @returns {unknown}
 */
const normalize = val => {
    if (Object.is(val, -0)) return 0;
    return val;
};

/**
 * Create a tap-style `t` assertion object for a single test case.
 * @param {TapPlan} plan - Shared plan state.
 * @param {() => void} onEnd - Called when `end()` is invoked.
 * @returns {TapAssertions} A `t` object with tap assertion methods.
 */
const createTapObject = (plan, onEnd) => {
    /**
     * Increment assertion count, then run the jest `expect()` callback.
     * @param {() => void} assertFn - Function that calls `expect(...)`.
     */
    const countAssert = assertFn => {
        plan.count++;
        assertFn();
    };

    return {
        /**
         * Specify the number of Test Points expected by this test.
         * @param {number} n - Expected number of assertions.
         */
        plan (n) {
            plan.expected = n;
        },

        /**
         * Explicitly mark the test as completed.
         * this is not required if the test function returns a
         * promise or if a plan is declared and fulfilled.  Here we
         * resolve the deferred promise so Jest knows the test is done.
         */
        end () {
            onEnd();
        },

        /**
         * Verify that the values are equal loosely.
         *
         * @param {unknown} actual
         * @param {unknown} expected
         */
        equal (actual, expected) {
            countAssert(() => {
                // eslint-disable-next-line eqeqeq
                expect(actual == expected).toBeTruthy();
            });
        },

        /**
         * Verify that the value is loosely equivalent to the
         * supplied pattern.
         *Delegates to Jest's `.toEqual()` (deep
         * equality).  `-0` is normalized to `0`, and `null`/`undefined`
         * are treated as equivalent.
         *
         * @param {unknown} actual
         * @param {unknown} expected
         */
        same (actual, expected) {
            countAssert(() => {
                const a = normalize(actual);
                const e = normalize(expected);
                // null and undefined are equivalent in TAP
                if ((a === null || a === undefined) &&
                    (e === null || e === undefined)) {
                    // eslint-disable-next-line eqeqeq
                    expect(a == e).toBeTruthy();
                    return;
                }
                expect(a).toEqual(e);
            });
        },

        /**
         * Verify that the value is strictly equivalent to the
         * supplied pattern.
         * Delegates to Jest's `.toStrictEqual()`.
         *
         * @param {unknown} actual
         * @param {unknown} expected
         */
        strictSame (actual, expected) {
            countAssert(() => expect(actual).toStrictEqual(expected));
        },

        /**
         * Verify that the values are not equal.
         * @param {unknown} actual
         * @param {unknown} expected
         */
        not (actual, expected) {
            countAssert(() => {
                // eslint-disable-next-line eqeqeq
                expect(actual == expected).toBeFalsy();
            });
        },

        /**
         * Verify that the value is not strictly equivalent to the
         * supplied pattern.
         * Delegates to Jest's `.not.toStrictEqual()`.
         *
         * @param {unknown} actual
         * @param {unknown} expected
         */
        strictNotSame (actual, expected) {
            countAssert(() => expect(actual).not.toStrictEqual(expected));
        },

        /**
         * Verify that the value is truthy.
         *
         * @param {unknown} value
         */
        ok (value) {
            countAssert(() => expect(value).toBeTruthy());
        },

        /**
         * Verify that the value is not truthy.
         *
         * @param {unknown} value
         */
        notOk (value) {
            countAssert(() => expect(value).toBeFalsy());
        },

        /**
         * Verify that the value is of the type specified.
         *
         * In TAP, `klass` can be a string (matched against `typeof`
         * result, `'null'`, or the constructor's `name`) or a
         * constructor function.  **This bridge only supports the
         * `typeof` string case** (e.g. `'string'`, `'number'`,
         * `'object'`, `'function'`, `'undefined'`).
         *
         * @param {unknown} value
         * @param {string} typeStr - Expected `typeof` result.
         */
        type (value, typeStr) {
            countAssert(() => expect(typeof value).toBe(typeStr));
        },

        /**
         * Verify that the function throws an error.
         *
         * Thrown error is tested against the `wanted` param if provided.
         * In TAP the error is tested via `t.match()`; here we delegate
         * to Jest's `.toThrow()`.
         * @param {Function} fn - Function expected to throw.
         * @param {Error|RegExp|string|Function} [expectedError] -
         *   Expected error.  Accepts an Error instance, regex, string
         *   (message substring), or constructor.
         */
        throws (fn, expectedError) {
            countAssert(() => {
                if (typeof expectedError === 'undefined') {
                    expect(fn).toThrow();
                } else {
                    expect(fn).toThrow(expectedError);
                }
            });
        },

        /**
         * Assert that the function does not throw.
         *
         * In TAP this returns the error object if it throws (and the
         * test is skip/todo).  Here we simply delegate to Jest's
         * `.not.toThrow()`.
         *
         * @param {Function} fn - Function expected not to throw.
         */
        doesNotThrow (fn) {
            countAssert(() => expect(fn).not.toThrow());
        },

        /**
         * A failing (not ok) Test Point.
         *
         * @param {string|Error} [message] - Failure message.
         */
        fail (message) {
            const msg = message instanceof Error ?
                message.message :
                `${message}`;
            countAssert(() => {
                process.stdout.write(`Test failed: ${msg}\n`);
                expect(true).toBe(false);
            });
        },

        /**
         * A passing (ok) Test Point.
         * @param {string} [message] - Optional message printed as a
         *   TAP comment.
         */
        pass (message) {
            countAssert(() => expect(true).toBe(true));
            if (message) {
                process.stdout.write(`# ${message}\n`);
            }
        },

        /**
         * Output a TAP comment, formatted like `console.log()`.
         * In TAP, comments are deferred until after any in-progress
         * child test completes.  Here we write directly to stdout.
         * @param {...unknown} args - Values to print (joined with space).
         */
        comment (...args) {
            process.stdout.write(`# ${args.join(' ')}\n`);
        },

        /**
         * Create a child test.
         * In TAP this creates a real child Test object and parses its
         * output as a subtest.  Since jest does not support add tests dynamically,
         * this bridge runs the sub-test inline and returns a Promise that resolves
         * when the sub-test completes (via `end()` or returning a promise).
         *
         * @param {string} name - Sub-test name.
         * @param {TapTestFn} fn - Sub-test function.
         * @returns {Promise<void>}
         */
        test (name, fn) {
            return new Promise((resolve, reject) => {
                const subPlan = {count: 0, expected: null};
                let subEnded = false;
                const subDone = () => {
                    if (subEnded) return;
                    subEnded = true;
                    if (subPlan.expected !== null) {
                        expect(subPlan.count).toBe(subPlan.expected);
                    }
                    resolve();
                };
                const subT = createTapObject(subPlan, subDone);
                try {
                    const result = fn(subT);
                    if (result && typeof result.then === 'function') {
                        result.then(
                            () => {
                                if (!subEnded) subDone();
                            },
                            reject
                        );
                    }
                } catch (err) {
                    reject(err);
                }
            });
        }
    };
};

/**
 * Register a tap-style test under Jest.
 *
 * The wrapper:
 *
 * 1. Creates a {@link TapAssertions} assertion object linked to the test.
 * 2. Runs the original tap test function with `t`.
 * 3. Returns a Promise to Jest so Jest waits for async completion.
 * 4. If the test function returns a Promise, chains completion on it.
 * 5. `end()` resolves the Promise (for callback-style async tests).
 * 6. Verifies `plan()` count when the test ends.
 *
 * @param {string} name - Test name.
 * @param {TapTestFn} fn - Original tap test function.
 */
const tapTest = (name, fn) => {
    test(name, () => new Promise((resolve, reject) => {
        const plan = /** @type {TapPlan} */ ({count: 0, expected: null});
        let ended = false;

        const done = () => {
            if (ended) return;
            ended = true;

            // Verify plan count if plan() was called.
            if (plan.expected !== null) {
                expect(plan.count).toBe(plan.expected);
            }

            resolve();
        };

        const t = createTapObject(plan, done);

        try {
            const result = fn(t);

            // If the test function returns a Promise, wait for it.
            if (result && typeof result.then === 'function') {
                result.then(
                    () => {
                        if (!ended) done();
                    },
                    err => {
                        if (!ended) {
                            ended = true;
                            reject(err);
                        }
                    }
                );
            }
        } catch (err) {
            if (!ended) {
                ended = true;
                reject(err);
            }
        }
    }));
};

tapTest.test = tapTest;
tapTest.beforeEach = function tapBeforeEach (fn) {
    beforeEach(fn);
};

/** @type {TapBridge} */
module.exports = tapTest;
