const Joystick = require('../../src/io/joystick');
const Runtime = require('../../src/engine/runtime');

test('spec', () => {
    const rt = new Runtime();
    const j = new Joystick(rt);

    expect(typeof j).toBe('object');
    expect(typeof j.postData).toBe('function');
    expect(typeof j.getX).toBe('function');
    expect(typeof j.getY).toBe('function');
    expect(typeof j.getDistance).toBe('function');
});

test('zeroJoystickTest', () => {
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
    expect(j.getX()).toBe(0);
    expect(j.getY()).toBe(0);
    expect(j.getDistance()).toBe(0);
});
