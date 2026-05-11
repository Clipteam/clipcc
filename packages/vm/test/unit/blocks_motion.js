import {test} from '../fixtures/jest-tap-bridge.js';
import Motion from '../../src/blocks/scratch3_motion';
import Runtime from '../../src/engine/runtime.js';
import Sprite from '../../src/sprites/sprite.js';
import RenderedTarget from '../../src/sprites/rendered-target.js';
import VirtualMachine from '../../src/index.js';

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
