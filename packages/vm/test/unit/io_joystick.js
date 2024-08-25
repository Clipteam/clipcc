const test = require('tap').test;
const Joystick = require('../../src/io/joystick');
const Runtime = require('../../src/engine/runtime');

test('spec', t => {
    const rt = new Runtime();
    const j = new Joystick(rt);

    t.type(j, 'object');
    t.type(j.postData, 'function');
    t.type(j.getX, 'function');
    t.type(j.getY, 'function');
    t.type(j.getDistance, 'function');
    t.end();
});

test('zeroJoystickTest', t => {
    const rt = new Runtime();
    const j = new Joystick(rt);

    j.postData({
        x: -30,
        y: 40,
        distance: 50
    });
    j.postData({
        x: 0,
        y: 0,
        distance: 0
    });
    t.equal(j.getX(), 0);
    t.equal(j.getY(), 0);
    t.equal(j.getDistance(), 0);
    t.end();
});
