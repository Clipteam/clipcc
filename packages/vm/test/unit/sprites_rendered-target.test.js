const RenderedTarget = require('../../src/sprites/rendered-target');
const Sprite = require('../../src/sprites/sprite');
const Runtime = require('../../src/engine/runtime');
const FakeRenderer = require('../fixtures/fake-renderer');

test('clone effects', () => {
    // Create two clones and ensure they have different graphic effect objects.
    // Regression test for Github issue #224
    const r = new Runtime();
    const spr = new Sprite(null, r);
    const a = new RenderedTarget(spr, r);
    const b = new RenderedTarget(spr, r);
    expect(a.effects !== b.effects).toBeTruthy();
});

test('setxy', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;
    a.setXY(123, 321, true);
    expect(a.x).toBe(123);
    expect(a.y).toBe(321);
});

test('blocks get new id on duplicate', done => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const rt = new RenderedTarget(s, r);
    const block = {
        id: 'id1',
        topLevel: true,
        fields: {}
    };

    rt.blocks.createBlock(block);

    return rt.duplicate().then(duplicate => {
        expect(duplicate.blocks._blocks.hasOwnProperty(block.id)).toBeFalsy();
        done();
    });
});

test('direction', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;
    a.setDirection(123);
    expect(a._getRenderedDirectionAndScale().direction).toBe(123);
});

test('setVisible', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;
    a.setVisible(true);
});

test('setSize', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;
    a.setSize(123);
    expect(a._getRenderedDirectionAndScale().scale[0]).toBe(123);
});

test('set and clear effects', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;
    for (const effect in a.effects) {
        a.setEffect(effect, 1);
        expect(a.effects[effect]).toBe(1);
    }
    a.clearEffects();
    for (const effect in a.effects) {
        expect(a.effects[effect]).toBe(0);
    }
});

test('setCostume', () => {
    const o = new Object();
    const r = new Runtime();
    const s = new Sprite(null, r);
    s.costumes = [o];
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;
    a.setCostume(0);
});

test('deleteCostume', () => {
    const o1 = {id: 1};
    const o2 = {id: 2};
    const o3 = {id: 3};
    const o4 = {id: 4};
    const o5 = {id: 5};

    const r = new Runtime();
    const s = new Sprite(null, r);
    s.costumes = [o1, o2, o3];
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;

    // x* Costume 1        * Costume 2
    //    Costume 2   =>     Costume 3
    //    Costume 3
    a.setCostume(0);
    const deletedCostume = a.deleteCostume(0);
    expect(a.sprite.costumes.length).toBe(2);
    expect(a.sprite.costumes[0].id).toBe(2);
    expect(a.sprite.costumes[1].id).toBe(3);
    expect(a.currentCostume).toBe(0);
    expect(deletedCostume).toEqual(o1);

    //    Costume 1          Costume 1
    // x* Costume 2   =>   * Costume 3
    //    Costume 3
    a.sprite.costumes = [o1, o2, o3];
    a.setCostume(1);
    const deletedCostume2 = a.deleteCostume(1);
    expect(a.sprite.costumes.length).toBe(2);
    expect(a.sprite.costumes[0].id).toBe(1);
    expect(a.sprite.costumes[1].id).toBe(3);
    expect(a.currentCostume).toBe(1);
    expect(deletedCostume2).toEqual(o2);

    //    Costume 1          Costume 1
    //    Costume 2   =>   * Costume 2
    // x* Costume 3
    a.sprite.costumes = [o1, o2, o3];
    a.setCostume(2);
    const deletedCostume3 = a.deleteCostume(2);
    expect(a.sprite.costumes.length).toBe(2);
    expect(a.sprite.costumes[0].id).toBe(1);
    expect(a.sprite.costumes[1].id).toBe(2);
    expect(a.currentCostume).toBe(1);
    expect(deletedCostume3).toEqual(o3);

    // Refuses to delete only costume
    a.sprite.costumes = [o1];
    a.setCostume(0);
    const noDeletedCostume = a.deleteCostume(0);
    expect(a.sprite.costumes.length).toBe(1);
    expect(a.sprite.costumes[0].id).toBe(1);
    expect(a.currentCostume).toBe(0);
    expect(noDeletedCostume).toBe(null);

    //   Costume 1          Costume 1
    // x Costume 2          Costume 3
    //   Costume 3   =>   * Costume 4
    // * Costume 4          Costume 5
    //   Costume 5
    a.sprite.costumes = [o1, o2, o3, o4, o5];
    a.setCostume(3);
    a.deleteCostume(1);
    expect(a.sprite.costumes.length).toBe(4);
    expect(a.sprite.costumes[0].id).toBe(1);
    expect(a.sprite.costumes[1].id).toBe(3);
    expect(a.sprite.costumes[2].id).toBe(4);
    expect(a.sprite.costumes[3].id).toBe(5);
    expect(a.currentCostume).toBe(2);

    //   Costume 1          Costume 1
    // * Costume 2        * Costume 2
    //   Costume 3   =>     Costume 3
    // x Costume 4          Costume 5
    //   Costume 5
    a.sprite.costumes = [o1, o2, o3, o4, o5];
    a.setCostume(1);
    a.deleteCostume(3);
    expect(a.sprite.costumes.length).toBe(4);
    expect(a.sprite.costumes[0].id).toBe(1);
    expect(a.sprite.costumes[1].id).toBe(2);
    expect(a.sprite.costumes[2].id).toBe(3);
    expect(a.sprite.costumes[3].id).toBe(5);
    expect(a.currentCostume).toBe(1);

    //   Costume 1          Costume 1
    // * Costume 2        * Costume 2
    //   Costume 3   =>     Costume 3
    //   Costume 4          Costume 4
    // x Costume 5
    a.sprite.costumes = [o1, o2, o3, o4, o5];
    a.setCostume(1);
    a.deleteCostume(4);
    expect(a.sprite.costumes.length).toBe(4);
    expect(a.sprite.costumes[0].id).toBe(1);
    expect(a.sprite.costumes[1].id).toBe(2);
    expect(a.sprite.costumes[2].id).toBe(3);
    expect(a.sprite.costumes[3].id).toBe(4);
    expect(a.currentCostume).toBe(1);
});

test('deleteSound', () => {
    const o1 = {id: 1};
    const o2 = {id: 2};
    const o3 = {id: 3};

    const r = new Runtime();
    const s = new Sprite(null, r);
    s.sounds = [o1, o2, o3];
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;

    const firstDeleted = a.deleteSound(0);
    expect(a.sprite.sounds).toEqual([o2, o3]);
    expect(firstDeleted).toEqual(o1);

    // Allows deleting the only sound
    a.sprite.sounds = [o1];
    a.deleteSound(0);
    expect(a.sprite.sounds).toEqual([]);
});

test('setRotationStyle', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;
    a.setRotationStyle(RenderedTarget.ROTATION_STYLE_NONE);
});

test('getBounds', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    expect(a.getBounds().top).toBe(0);
    a.setXY(241, 241);
    expect(a.getBounds().top).toBe(241);
});

test('isTouchingPoint', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    expect(a.isTouchingPoint()).toBe(true);
});

test('isTouchingEdge', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    expect(a.isTouchingEdge()).toBe(false);
    a.setXY(1000, 1000);
    expect(a.isTouchingEdge()).toBe(true);
});

test('isTouchingSprite', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    expect(a.isTouchingSprite('fake')).toBe(false);
});

test('isTouchingColor', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    expect(a.isTouchingColor()).toBe(false);
});

test('colorIsTouchingColor', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    expect(a.colorIsTouchingColor()).toBe(false);
});

test('layers', () => {
    // TODO this tests fake functionality. Move layering tests into Render.
    const r = new Runtime();
    const s = new Sprite(null, r);
    const renderer = new FakeRenderer();
    const o = new Object();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    a.goToFront();
    expect(a.renderer.order).toBe(5);
    a.goBackwardLayers(2);
    expect(a.renderer.order).toBe(3);
    a.goToBack();
    // Note, there are only sprites in this test, no stage, and the addition
    // of layer groups, goToBack no longer specifies a minimum order number
    expect(a.renderer.order).toBe(0);
    a.goForwardLayers(1);
    expect(a.renderer.order).toBe(1);
    o.drawableID = 999;
    a.goBehindOther(o);
    expect(a.renderer.order).toBe(1);
});

test('getLayerOrder returns result of renderer getDrawableOrder or null if renderer is not attached', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const a = new RenderedTarget(s, r);

    // getLayerOrder should return null if there is no renderer attached to the runtime
    expect(a.getLayerOrder()).toBe(null);

    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const b = new RenderedTarget(s, r);

    expect(b.getLayerOrder()).toBe('stub');
});

test('keepInFence', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    expect(a.keepInFence(1000, 1000)[0]).toBe(240);
    expect(a.keepInFence(-1000, 1000)[0]).toBe(-240);
    expect(a.keepInFence(1000, 1000)[1]).toBe(180);
    expect(a.keepInFence(1000, -1000)[1]).toBe(-180);
});

test('#stopAll clears graphics effects', () => {
    const r = new Runtime();
    const s = new Sprite(null, r);
    const a = new RenderedTarget(s, r);
    const effectName = 'brightness';
    a.setEffect(effectName, 100);
    a.onStopAll();
    expect(a.effects[effectName]).toBe(0);
});

test('#getCostumes returns the costumes', () => {
    const r = new Runtime();
    const spr = new Sprite(null, r);
    const a = new RenderedTarget(spr, r);
    a.sprite.costumes = [{id: 1}, {id: 2}, {id: 3}];
    expect(a.getCostumes().length).toBe(3);
    expect(a.getCostumes()[0].id).toBe(1);
    expect(a.getCostumes()[1].id).toBe(2);
    expect(a.getCostumes()[2].id).toBe(3);
});

test('#getSounds returns the sounds', () => {
    const r = new Runtime();
    const spr = new Sprite(null, r);
    const a = new RenderedTarget(spr, r);
    const sounds = [1, 2, 3];
    a.sprite.sounds = sounds;
    expect(a.getSounds()).toBe(sounds);
});

test('#toJSON returns the sounds and costumes', () => {
    const r = new Runtime();
    const spr = new Sprite(null, r);
    const a = new RenderedTarget(spr, r);
    const sounds = [1, 2, 3];
    a.sprite.sounds = sounds;
    a.sprite.costumes = [{id: 1}, {id: 2}, {id: 3}];
    expect(a.toJSON().sounds).toEqual(sounds);
    expect(a.toJSON().costumes).toEqual(a.sprite.costumes);
});

test('#addSound does not duplicate names', () => {
    const r = new Runtime();
    const spr = new Sprite(null, r);
    const a = new RenderedTarget(spr, r);
    a.sprite.sounds = [{name: 'first'}];
    a.addSound({name: 'first'});
    expect(a.sprite.sounds).toEqual([{name: 'first'}, {name: 'first2'}]);
});

test('#addCostume does not duplicate names', () => {
    const r = new Runtime();
    const spr = new Sprite(null, r);
    const a = new RenderedTarget(spr, r);
    a.addCostume({name: 'first'});
    a.addCostume({name: 'first'});
    expect(a.sprite.costumes.length).toBe(2);
    expect(a.sprite.costumes[0].name).toBe('first');
    expect(a.sprite.costumes[1].name).toBe('first2');
});

test('#renameSound does not duplicate names', () => {
    const r = new Runtime();
    const spr = new Sprite(null, r);
    const a = new RenderedTarget(spr, r);
    a.sprite.sounds = [{name: 'first'}, {name: 'second'}];
    a.renameSound(0, 'first'); // Shouldn't increment the name, noop
    expect(a.sprite.sounds).toEqual([{name: 'first'}, {name: 'second'}]);
    a.renameSound(1, 'first');
    expect(a.sprite.sounds).toEqual([{name: 'first'}, {name: 'first2'}]);
});

test('#renameCostume does not duplicate names', () => {
    const r = new Runtime();
    const spr = new Sprite(null, r);
    const a = new RenderedTarget(spr, r);
    a.sprite.costumes = [{name: 'first'}, {name: 'second'}];
    a.renameCostume(0, 'first'); // Shouldn't increment the name, noop
    expect(a.sprite.costumes.length).toBe(2);
    expect(a.sprite.costumes[0].name).toBe('first');
    expect(a.sprite.costumes[1].name).toBe('second');
    a.renameCostume(1, 'first');
    expect(a.sprite.costumes.length).toBe(2);
    expect(a.sprite.costumes[0].name).toBe('first');
    expect(a.sprite.costumes[1].name).toBe('first2');
});

test('#reorderCostume', () => {
    const o1 = {id: 0};
    const o2 = {id: 1};
    const o3 = {id: 2};
    const o4 = {id: 3};
    const o5 = {id: 4};
    const r = new Runtime();
    const s = new Sprite(null, r);
    s.costumes = [o1, o2, o3, o4, o5];
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;

    const resetCostumes = () => {
        a.setCostume(0);
        s.costumes = [o1, o2, o3, o4, o5];
    };
    const costumeIds = () => a.sprite.costumes.map(c => c.id);

    resetCostumes();
    expect(costumeIds()).toEqual([0, 1, 2, 3, 4]);
    expect(a.currentCostume).toBe(0);

    // Returns false if the costumes are the same and no change occurred
    expect(a.reorderCostume(3, 3)).toBe(false);
    expect(a.reorderCostume(999, 5000)).toBe(false); // Clamped to the same values.
    expect(a.reorderCostume(-999, -5000)).toBe(false);

    // Make sure reordering up and down works and current costume follows
    resetCostumes();
    expect(a.reorderCostume(0, 3)).toBe(true);
    expect(costumeIds()).toEqual([1, 2, 3, 0, 4]);
    expect(a.currentCostume).toBe(3); // Index of id=0

    resetCostumes();
    a.setCostume(1);
    expect(a.reorderCostume(3, 1)).toBe(true);
    expect(costumeIds()).toEqual([0, 3, 1, 2, 4]);
    expect(a.currentCostume).toBe(2); // Index of id=1

    // Out of bounds indices get clamped
    resetCostumes();
    expect(a.reorderCostume(10, 0)).toBe(true);
    expect(costumeIds()).toEqual([4, 0, 1, 2, 3]);
    expect(a.currentCostume).toBe(1); // Index of id=0

    resetCostumes();
    expect(a.reorderCostume(2, -1000)).toBe(true);
    expect(costumeIds()).toEqual([2, 0, 1, 3, 4]);
    expect(a.currentCostume).toBe(1); // Index of id=0
});

test('#reorderSound', () => {
    const o1 = {id: 0, name: 'name0'};
    const o2 = {id: 1, name: 'name1'};
    const o3 = {id: 2, name: 'name2'};
    const o4 = {id: 3, name: 'name3'};
    const o5 = {id: 4, name: 'name4'};
    const r = new Runtime();
    const s = new Sprite(null, r);
    s.sounds = [o1, o2, o3, o4, o5];
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;

    const resetSounds = () => {
        s.sounds = [o1, o2, o3, o4, o5];
    };
    const soundIds = () => a.sprite.sounds.map(c => c.id);

    resetSounds();
    expect(soundIds()).toEqual([0, 1, 2, 3, 4]);

    // Return false if indices are the same and no change occurred.
    expect(a.reorderSound(3, 3)).toBe(false);
    expect(a.reorderSound(100000, 99999)).toBe(false); // Clamped to the same values
    expect(a.reorderSound(-100000, -99999)).toBe(false);

    // Make sure reordering up and down works and current sound follows
    resetSounds();
    expect(a.reorderSound(0, 3)).toBe(true);
    expect(soundIds()).toEqual([1, 2, 3, 0, 4]);

    resetSounds();
    expect(a.reorderSound(3, 1)).toBe(true);
    expect(soundIds()).toEqual([0, 3, 1, 2, 4]);

    // Out of bounds indices get clamped
    resetSounds();
    expect(a.reorderSound(10, 0)).toBe(true);
    expect(soundIds()).toEqual([4, 0, 1, 2, 3]);

    resetSounds();
    expect(a.reorderSound(2, -1000)).toBe(true);
    expect(soundIds()).toEqual([2, 0, 1, 3, 4]);
});
