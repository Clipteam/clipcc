const Timer = require('../../src/util/timer');

// Stubbed current time
let NOW = 0;

const testNow = {
    now: () => {
        NOW += 100;
        return NOW;
    }
};

test('spec', () => {
    const timer = new Timer(testNow);

    expect(typeof Timer).toBe('function');
    expect(typeof timer).toBe('object');

    expect(typeof timer.startTime).toBe('number');
    expect(typeof timer.time).toBe('function');
    expect(typeof timer.start).toBe('function');
    expect(typeof timer.timeElapsed).toBe('function');
    expect(typeof timer.setTimeout).toBe('function');
    expect(typeof timer.clearTimeout).toBe('function');
});

test('time', () => {
    const timer = new Timer(testNow);
    const time = timer.time();

    expect(testNow.now() >= time).toBeTruthy();
});

test('start / timeElapsed', () => {
    const timer = new Timer(testNow);
    const delay = 100;
    const threshold = 1000 / 60; // 60 hz

    // Start timer
    timer.start();

    // Measure timer
    const timeElapsed = timer.timeElapsed();
    expect(timeElapsed >= 0).toBeTruthy();
    expect(timeElapsed >= (delay - threshold) &&
         timeElapsed <= (delay + threshold)).toBeTruthy();
});

test('setTimeout / clearTimeout', done => new Promise((resolve, reject) => {
    const timer = new Timer(testNow);
    const cancelId = timer.setTimeout(() => {
        reject(new Error('Canceled task ran'));
    }, 1);
    timer.setTimeout(() => {
        resolve('Non-canceled task ran');
        done();
    }, 2);
    timer.clearTimeout(cancelId);
}));
