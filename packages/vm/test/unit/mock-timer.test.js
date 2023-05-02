const MockTimer = require('../fixtures/mock-timer');

test('spec', () => {
    const timer = new MockTimer();

    expect(typeof MockTimer).toBe('function');
    expect(typeof timer).toBe('object');

    // Most members of MockTimer mimic members of Timer.
    expect(typeof timer.startTime).toBe('number');
    expect(typeof timer.time).toBe('function');
    expect(typeof timer.start).toBe('function');
    expect(typeof timer.timeElapsed).toBe('function');
    expect(typeof timer.setTimeout).toBe('function');
    expect(typeof timer.clearTimeout).toBe('function');

    // A few members of MockTimer have no Timer equivalent and should only be used in tests.
    expect(typeof timer.advanceMockTime).toBe('function');
    expect(typeof timer.advanceMockTimeAsync).toBe('function');
    expect(typeof timer.hasTimeouts).toBe('function');
});

test('time', () => {
    const timer = new MockTimer();
    const delta = 1;

    const time1 = timer.time();
    const time2 = timer.time();
    timer.advanceMockTime(delta);
    const time3 = timer.time();

    expect(time1).toBe(time2);
    expect(time2 + delta).toBe(time3);
});

test('start / timeElapsed', done => new Promise(resolve => {
    const timer = new MockTimer();
    const halfDelay = 1;
    const fullDelay = halfDelay + halfDelay;

    timer.start();

    let timeoutCalled = 0;

    // Wait and measure timer
    timer.setTimeout(() => {
        expect(timeoutCalled).toBe(0);
        ++timeoutCalled;

        const timeElapsed = timer.timeElapsed();
        expect(timeElapsed).toBe(fullDelay);
        done();

        resolve();
    }, fullDelay);

    // this should not trigger the callback
    timer.advanceMockTime(halfDelay);

    // give the mock timer a chance to run tasks
    global.setTimeout(() => {
        // we've only mock-waited for half the delay so it should not have run yet
        expect(timeoutCalled).toBe(0);

        // this should trigger the callback
        timer.advanceMockTime(halfDelay);
    }, 0);
}));

test('clearTimeout / hasTimeouts', done => new Promise((resolve, reject) => {
    const timer = new MockTimer();

    const timeoutId = timer.setTimeout(() => {
        reject(new Error('Canceled task ran'));
    }, 1);

    timer.setTimeout(() => {
        resolve('Non-canceled task ran');
        done();
    }, 2);

    timer.clearTimeout(timeoutId);

    while (timer.hasTimeouts()) {
        timer.advanceMockTime(1);
    }
}));
