import {test} from '../fixtures/jest-tap-bridge.js';
import Clock from '../../src/io/clock.js';
import Runtime from '../../src/engine/runtime.js';

test('spec', t => {
    const rt = new Runtime();
    const c = new Clock(rt);

    t.type(Clock, 'function');
    t.type(c, 'object');
    t.type(c.projectTimer, 'function');
    t.type(c.pause, 'function');
    t.type(c.resume, 'function');
    t.type(c.resetProjectTimer, 'function');
    t.end();
});

test('cycle', t => {
    const rt = new Runtime();
    const c = new Clock(rt);

    t.ok(c.projectTimer() <= 0.1);
    setTimeout(() => {
        c.resetProjectTimer();
        setTimeout(() => {
            // The timer shouldn't advance until all threads have been stepped
            t.ok(c.projectTimer() === 0);
            c.pause();
            t.ok(c.projectTimer() === 0);
            c.resume();
            t.ok(c.projectTimer() === 0);
            t.end();
        }, 100);
    }, 100);
    rt._step();
    t.ok(c.projectTimer() >= 0);
});
