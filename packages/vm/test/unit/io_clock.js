const Clock = require('../../src/io/clock');
const Runtime = require('../../src/engine/runtime');

test('spec', () => {
    const rt = new Runtime();
    const c = new Clock(rt);

    expect(typeof Clock).toBe('function');
    expect(typeof c).toBe('object');
    expect(typeof c.projectTimer).toBe('function');
    expect(typeof c.pause).toBe('function');
    expect(typeof c.resume).toBe('function');
    expect(typeof c.resetProjectTimer).toBe('function');
});

test('cycle', done => {
    const rt = new Runtime();
    const c = new Clock(rt);

    expect(c.projectTimer() <= 0.1).toBeTruthy();
    setTimeout(() => {
        c.resetProjectTimer();
        setTimeout(() => {
            // The timer shouldn't advance until all threads have been stepped
            expect(c.projectTimer() === 0).toBeTruthy();
            c.pause();
            expect(c.projectTimer() === 0).toBeTruthy();
            c.resume();
            expect(c.projectTimer() === 0).toBeTruthy();
            done();
        }, 100);
    }, 100);
    rt._step();
    expect(c.projectTimer() > 0).toBeTruthy();
});
