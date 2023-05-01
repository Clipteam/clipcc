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
    t.strictDeepEquals(k._keysPressed, ['space']);
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
    t.strictDeepEquals(k._keysPressed, ['A']);
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
    t.strictDeepEquals(k._keysPressed, ['1']);
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
    t.strictDeepEquals(k._keysPressed, ['日']);
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
    t.strictDeepEquals(k._keysPressed, []);
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
    t.strictDeepEquals(k._keysPressed, []);
    expect(k.getKeyIsDown('left arrow')).toBe(false);
    expect(k.getKeyIsDown('any')).toBe(false);
});
