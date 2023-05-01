const Keyboard = require('../../src/io/keyboard');
const Runtime = require('../../src/engine/runtime');

test('spec', () => {
    const rt = new Runtime();
    const k = new Keyboard(rt);

    expect(typeof k).toBe('object');
    expect(typeof k.postData).toBe('function');
    expect(typeof k.getKeyIsDown).toBe('function');
});

test('space key', () => {
    const rt = new Runtime();
    const k = new Keyboard(rt);

    k.postData({
        key: ' ',
        isDown: true
    });
    expect(k._keysPressed.length).toBe(1);
    expect(k._keysPressed[0]).toBe('space');
    expect(k.getKeyIsDown('space')).toBe(true);
    expect(k.getKeyIsDown('any')).toBe(true);
});

test('letter key', () => {
    const rt = new Runtime();
    const k = new Keyboard(rt);

    k.postData({
        key: 'a',
        isDown: true
    });
    expect(k._keysPressed.length).toBe(1);
    expect(k._keysPressed[0]).toBe('A');
    expect(k.getKeyIsDown(65)).toBe(true);
    expect(k.getKeyIsDown('a')).toBe(true);
    expect(k.getKeyIsDown('A')).toBe(true);
    expect(k.getKeyIsDown('any')).toBe(true);
});

test('number key', () => {
    const rt = new Runtime();
    const k = new Keyboard(rt);

    k.postData({
        key: '1',
        isDown: true
    });
    expect(k._keysPressed.length).toBe(1);
    expect(k._keysPressed[0]).toBe('1');
    expect(k.getKeyIsDown(49)).toBe(true);
    expect(k.getKeyIsDown('1')).toBe(true);
    expect(k.getKeyIsDown('any')).toBe(true);
});

test('non-english key', () => {
    const rt = new Runtime();
    const k = new Keyboard(rt);

    k.postData({
        key: '日',
        isDown: true
    });
    expect(k._keysPressed.length).toBe(1);
    expect(k._keysPressed[0]).toBe('日');
    expect(k.getKeyIsDown('日')).toBe(true);
    expect(k.getKeyIsDown('any')).toBe(true);
});

test('ignore modifier key', () => {
    const rt = new Runtime();
    const k = new Keyboard(rt);

    k.postData({
        key: 'Shift',
        isDown: true
    });
    expect(k._keysPressed.length).toBe(0);
    expect(k.getKeyIsDown('any')).toBe(false);
});

test('keyup', () => {
    const rt = new Runtime();
    const k = new Keyboard(rt);

    k.postData({
        key: 'ArrowLeft',
        isDown: true
    });
    k.postData({
        key: 'ArrowLeft',
        isDown: false
    });
    expect(k._keysPressed.length).toBe(0);
    expect(k.getKeyIsDown('left arrow')).toBe(false);
    expect(k.getKeyIsDown('any')).toBe(false);
});
