/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

export class DispatchTestService {
    returnFortyTwo() {
        return 42;
    }

    doubleArgument(x: number) {
        return 2 * x;
    }

    throwException() {
        throw new Error('This is a test exception thrown by DispatchTest');
    }
}
