const Motion = require('../../src/blocks/scratch3_motion');
const Runtime = require('../../src/engine/runtime');
const Sprite = require('../../src/sprites/sprite.js');
const RenderedTarget = require('../../src/sprites/rendered-target.js');

test('getPrimitives', () => {
    const rt = new Runtime();
    const motion = new Motion(rt);
    expect(typeof motion.getPrimitives()).toBe('object');
});

test('Coordinates have limited precision', () => {
    const rt = new Runtime();
    const motion = new Motion(rt);
    const sprite = new Sprite(null, rt);
    const target = new RenderedTarget(sprite, rt);
    const util = {target};

    motion.goToXY({X: 0.999999999, Y: 0.999999999}, util);

    expect(motion.getX({}, util)).toBe(1);
    expect(motion.getY({}, util)).toBe(1);
});
