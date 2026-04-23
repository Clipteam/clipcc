/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

import {describe, expect, test, beforeAll} from '@jest/globals';
import Worker from 'tiny-worker';
import dispatch from '../../../src/adapter/scratch/dispatch/central-dispatch';
import {DispatchTestService} from '../../fixtures/dispatch-test-service';

function runServiceTest(serviceName: string) {
    const promises = [
        expect(dispatch.call(serviceName, 'returnFortyTwo')).resolves.toEqual(42),
        expect(dispatch.call(serviceName, 'doubleArgument', 9)).resolves.toEqual(18),
        expect(dispatch.call(serviceName, 'doubleArgument', 123)).resolves.toEqual(246),
        expect(dispatch.call(serviceName, 'throwException')).rejects.toBeDefined()
    ];
    return Promise.all(promises);
}

describe('Scratch: Dispatch', () => {
    beforeAll(() => {
        dispatch['workerClass'] = Worker as any; // Inject worker type to get correct isRemote.
    });

    test('local', () => {
        dispatch.setService('LocalDispatchTest', new DispatchTestService());
        return runServiceTest('LocalDispatchTest');
    });

    test('remote', () => {
        const worker = new Worker('test/dist/worker.js');
        dispatch.addWorker(worker as any);

        const waitForWorker = new Promise<void>(resolve => {
            dispatch.setService('test', {
                onWorkerReady: resolve
            });
        });

        return waitForWorker
            .then(() => runServiceTest('RemoteDispatchTest'))
            .then(() => dispatch['remoteCall'](worker as any, 'dispatch', 'terminate'));
    });

    test('local, sync', () => {
        dispatch.setServiceSync('SyncDispatchTest', new DispatchTestService());

        expect(dispatch.callSync('SyncDispatchTest', 'returnFortyTwo')).toEqual(42);
        expect(dispatch.callSync('SyncDispatchTest', 'doubleArgument', 9)).toEqual(18);
        expect(dispatch.callSync('SyncDispatchTest', 'doubleArgument', 123)).toEqual(246);
        expect(() => dispatch.callSync('SyncDispatchTest', 'throwException'))
            .toThrow('This is a test exception thrown by DispatchTest');
    })
});
