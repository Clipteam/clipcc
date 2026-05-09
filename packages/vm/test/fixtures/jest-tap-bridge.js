/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MIT
 */

/**
 * @fileoverview A bridge to make old tap tests can run under jest environment seamlessly.
 */

/**
 * Create a tap-style t assertion object for a single test case.
 *
 * @param {{ count: number, expected: number | null }} plan - Shared plan state.
 * @param {() => void} onEnd - Called when t.end() is invoked.
 * @returns {object} A t object with tap assertion methods.
 */
const createTapObject = (plan, onEnd) => {
    /**
     * increment assertion count then run the jest expect callback.
     * @param {() => void} assertFn - Function that calls expect(...).
     */
    const countAssert = assertFn => {
        plan.count++;
        assertFn();
    };

    /**
     * Normalize values for TAP-compatible comparison.
     * -0 is normalized to 0 (TAP treats them as equal).
     * @param {unknown} val
     * @returns {unknown}
     */
    const normalize = val => {
        if (Object.is(val, -0)) return 0;
        return val;
    };

    return {
        /**
         * t.plan(n) - Declare expected number of assertions.
         * Verified at test end (when t.end() is called or the test completes).
         * @param {number} n The expected number of assertions in this test.
         */
        plan (n) {
            plan.expected = n;
        },

        /**
         * t.end() - Signal test completion.
         * In tap, the test is not done until t.end() is called.
         * Here we resolve the deferred promise so jest knows the test is complete.
         */
        end () {
            onEnd();
        },

        /**
         * t.equal(actual, expected) - Loose equality (==).
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
         * t.same(actual, expected) - Deep equality.
         * In modern tap (v21), `equal` and `same` are aliases for deep equality.
         * We use deep equality but normalize -0 and null/undefined.
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
         * t.strictSame(actual, expected) - Strict deep equality.
         * Jest's toStrictEqual checks for undefined properties, array holes, etc.
         * @param {unknown} actual
         * @param {unknown} expected
         */
        strictSame (actual, expected) {
            countAssert(() => expect(actual).toStrictEqual(expected));
        },

        /**
         * t.not(actual, expected) - Inverse of loose equality.
         * In TAP, `not` uses != comparison (reference for objects, loose for primitives).
         * @param {unknown} actual
         * @param {unknown} expected
         */
        not (actual, expected) {
            countAssert(() => {
                // TAP uses != which compares by reference for objects
                // eslint-disable-next-line eqeqeq
                expect(actual == expected).toBeFalsy();
            });
        },

        /**
         * t.strictNotSame(actual, expected) - Inverse of strict deep equality.
         * @param {unknown} actual
         * @param {unknown} expected
         */
        strictNotSame (actual, expected) {
            countAssert(() => expect(actual).not.toStrictEqual(expected));
        },

        /**
         * t.ok(value) - Check truthiness.
         * @param {unknown} value
         */
        ok (value) {
            countAssert(() => expect(value).toBeTruthy());
        },

        /**
         * t.notOk(value) - Check falsiness.
         * @param {unknown} value
         */
        notOk (value) {
            countAssert(() => expect(value).toBeFalsy());
        },

        /**
         * t.type(value, type) - Check typeof value.
         * Tap uses string representations: 'string', 'number', 'object', 'function', 'undefined'.
         * @param {unknown} value
         * @param {string} typeStr
         */
        type (value, typeStr) {
            countAssert(() => expect(typeof value).toBe(typeStr));
        },

        /**
         * t.throws(fn, expectedError) - Expect fn to throw.
         * expectedError can be an Error instance, regex, string, or class.
         * @param {Function} fn
         * @param {Error|RegExp|string|Function} expectedError
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
         * t.doesNotThrow(fn) - Expect fn not to throw.
         * @param {Function} fn
         */
        doesNotThrow (fn) {
            countAssert(() => expect(fn).not.toThrow());
        },

        /**
         * t.fail(message) - Unconditional test failure.
         * Handles string messages and Error objects.
         * @param {string|Error} [message]
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
         * t.pass(message) - Unconditional test pass.
         * No-op assertion that always succeeds.
         * @param {string} [message]
         */
        pass (message) {
            countAssert(() => expect(true).toBe(true));
            if (message) {
                process.stdout.write(`# ${message}\n`);
            }
        },

        /**
         * t.comment(...args) - Output a TAP comment to stdout.
         * Tap comments are prefixed with '# ' and written to the TAP stream.
         * Multiple arguments are joined like console.log.
         * @param {...unknown} args
         */
        comment (...args) {
            process.stdout.write(`# ${args.join(' ')}\n`);
        },

        /**
         * t.test(name, fn) - Create a sub-test.
         * Returns a Promise that resolves when the sub-test completes.
         * @param {string} name - Sub-test name.
         * @param {(t: object) => void|Promise} fn - Sub-test function.
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
                            () => { if (!subEnded) subDone(); },
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
 * Wraps a tap-style test function so it runs correctly under jest.
 *
 * The wrapper does the following:
 * 1. Creates a `t` assertion object linked to the test.
 * 2. Runs the original tap test function with t.
 * 3. Returns a Promise to jest so jest waits for async completion.
 * 4. If the original fn returns a Promise, chains completion on it too.
 * 5. t.end() resolves the Promise (for callback-style async tests).
 * 6. Verifies t.plan() count when the test ends.
 *
 * @param {string} name - Test name.
 * @param {(t: object) => void|Promise} fn - Original tap test function.
 */
const tapTest = (name, fn) => {
    test(name, () => new Promise((resolve, reject) => {
        const plan = {count: 0, expected: null};
        let ended = false;

        const done = () => {
            if (ended) return;
            ended = true;

            // Verify plan count if t.plan() was called.
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

// Attach the test method to the bridge object itself so it can be used as:
// const test = require('...').test;
tapTest.test = tapTest;

// Attach beforeEach for files that do: tap.beforeEach(...)
tapTest.beforeEach = function tapBeforeEach (fn) {
    beforeEach(fn);
};

module.exports = tapTest;
