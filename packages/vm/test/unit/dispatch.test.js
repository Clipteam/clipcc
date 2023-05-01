const DispatchTestService = require('../fixtures/dispatch-test-service');
const Worker = require('tiny-worker');

const dispatch = require('../../src/dispatch/central-dispatch');
const path = require('path');


// By default Central Dispatch works with the Worker class built into the browser. Tell it to use TinyWorker instead.
dispatch.workerClass = Worker;

const runServiceTest = function (serviceName, t) {
    const promises = [];

    promises.push(dispatch.call(serviceName, 'returnFortyTwo')
        .then(
            x => expect(x).toBe(42),
            e => t.fail(e)
        ));

    promises.push(dispatch.call(serviceName, 'doubleArgument', 9)
        .then(
            x => expect(x).toBe(18),
            e => t.fail(e)
        ));

    promises.push(dispatch.call(serviceName, 'doubleArgument', 123)
        .then(
            x => expect(x).toBe(246),
            e => t.fail(e)
        ));

    // I tried using `t.rejects` here but ran into https://github.com/tapjs/node-tap/issues/384
    promises.push(dispatch.call(serviceName, 'throwException')
        .then(
            () => t.fail('exception was not propagated as expected'),
            () => t.pass('exception was propagated as expected')
        ));

    return Promise.all(promises);
};

test('local', done => {
    dispatch.setService('LocalDispatchTest', new DispatchTestService())
        .catch(e => done.fail(e));

    return runServiceTest('LocalDispatchTest', t);
});

test('remote', done => {
    const fixturesDir = path.resolve(__dirname, '../fixtures');
    const shimPath = path.resolve(fixturesDir, 'dispatch-test-worker-shim.js');
    const worker = new Worker(shimPath, null, {cwd: fixturesDir});
    dispatch.addWorker(worker);

    const waitForWorker = new Promise(resolve => {
        dispatch.setService('test', {onWorkerReady: resolve})
            .catch(e => done.fail(e));
    });

    return waitForWorker
        .then(() => runServiceTest('RemoteDispatchTest', t), e => done.fail(e))
        .then(() => dispatch._remoteCall(worker, 'dispatch', 'terminate'), e => done.fail(e));
});

test('local, sync', () => {
    dispatch.setServiceSync('SyncDispatchTest', new DispatchTestService());

    const a = dispatch.callSync('SyncDispatchTest', 'returnFortyTwo');
    expect(a).toBe(42);

    const b = dispatch.callSync('SyncDispatchTest', 'doubleArgument', 9);
    expect(b).toBe(18);

    const c = dispatch.callSync('SyncDispatchTest', 'doubleArgument', 123);
    expect(c).toBe(246);

    expect(() => dispatch.callSync('SyncDispatchTest', 'throwException')).toThrowError(new Error('This is a test exception thrown by DispatchTest'));
});
