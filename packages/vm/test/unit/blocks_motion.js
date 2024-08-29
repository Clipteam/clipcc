const test = require('tap').test;
const Motion = require('../../src/blocks/scratch3_motion');
const Runtime = require('../../src/engine/runtime');
const Sprite = require('../../src/sprites/sprite.js');
const RenderedTarget = require('../../src/sprites/rendered-target.js');
const VirtualMachine = require('../../src');

test('getPrimitives', t => {
    const rt = new Runtime();
    const motion = new Motion(rt);
    t.type(motion.getPrimitives(), 'object');
    t.end();
});

test('Coordinates have limited precision', t => {
    const rt = new Runtime();
    const motion = new Motion(rt);
    const sprite = new Sprite(null, rt);
    const target = new RenderedTarget(sprite, rt);
    const util = {target};

    motion.goToXY({X: 0.999999999, Y: 0.999999999}, util);

    t.equal(motion.getX({}, util), 1);
    t.equal(motion.getY({}, util), 1);
    t.end();
});

test('Costumed stage has correct size', t => {
    const vm = new VirtualMachine();
    const rt = vm.runtime;
    const motion = new Motion(rt);
    const sprite = new Sprite(null, rt);
    const target = new RenderedTarget(sprite, rt);
    const util = {target};
    vm.setStageSize(640, 640);
    
    motion.goToXY({X: 640, Y: 640}, util);

    t.equal(motion.getX({}, util), 640);
    t.equal(motion.getY({}, util), 640);
    t.end();
});
