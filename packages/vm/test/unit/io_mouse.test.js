const Mouse = require('../../src/io/mouse');
const Runtime = require('../../src/engine/runtime');

test('spec', () => {
    const rt = new Runtime();
    const m = new Mouse(rt);

    expect(typeof m).toBe('object');
    expect(typeof m.postData).toBe('function');
    expect(typeof m.getClientX).toBe('function');
    expect(typeof m.getClientY).toBe('function');
    expect(typeof m.getScratchX).toBe('function');
    expect(typeof m.getScratchY).toBe('function');
    expect(typeof m.getIsDown).toBe('function');
});

test('mouseUp', () => {
    const rt = new Runtime();
    const m = new Mouse(rt);

    m.postData({
        button: 0,
        x: -20,
        y: 10,
        isDown: false,
        canvasWidth: 480,
        canvasHeight: 360
    });
    expect(m.getClientX()).toBe(-20);
    expect(m.getClientY()).toBe(10);
    expect(m.getScratchX()).toBe(-240);
    expect(m.getScratchY()).toBe(170);
    expect(m.getIsDown()).toBe(false);
});

test('mouseDown', () => {
    const rt = new Runtime();
    const m = new Mouse(rt);

    m.postData({
        button: 0,
        x: 9.9,
        y: 400.1,
        isDown: true,
        canvasWidth: 480,
        canvasHeight: 360
    });
    expect(m.getClientX()).toBe(9.9);
    expect(m.getClientY()).toBe(400.1);
    expect(m.getScratchX()).toBe(-230);
    expect(m.getScratchY()).toBe(-180);
    expect(m.getIsDown()).toBe(true);
});

test('at zoomed scale', () => {
    const rt = new Runtime();
    const m = new Mouse(rt);

    m.postData({
        button: 0,
        x: 240,
        y: 540,
        canvasWidth: 960,
        canvasHeight: 720
    });
    expect(m.getClientX()).toBe(240);
    expect(m.getClientY()).toBe(540);
    expect(m.getScratchX()).toBe(-120);
    expect(m.getScratchY()).toBe(-90);
});

test('mousedown activating click hats', () => {
    const rt = new Runtime();
    const m = new Mouse(rt);

    const mouseMoveEvent = {
        button: 0,
        x: 10,
        y: 100,
        canvasWidth: 480,
        canvasHeight: 360
    };

    const dummyTarget = {
        draggable: false
    };

    const mouseDownEvent = Object.assign({}, mouseMoveEvent, {
        button: 0,
        isDown: true
    });

    const mouseUpEvent = Object.assign({}, mouseMoveEvent, {
        button: 0,
        isDown: false
    });

    // Stub activateClickHats and pick function for testing
    let ranClickHats = false;
    m._activateClickHats = () => {
        ranClickHats = true;
    };
    m._pickTarget = () => dummyTarget;

    // Mouse move without mousedown
    m.postData(mouseMoveEvent);
    expect(ranClickHats).toBe(false);

    // Mouse down event triggers the hats if target is not draggable
    dummyTarget.draggable = false;
    m.postData(mouseDownEvent);
    expect(ranClickHats).toBe(true);

    // But another mouse move while down doesn't trigger
    ranClickHats = false;
    m.postData(mouseDownEvent);
    expect(ranClickHats).toBe(false);

    // And it does trigger on mouse up if target is draggable
    ranClickHats = false;
    dummyTarget.draggable = true;
    m.postData(mouseUpEvent);
    expect(ranClickHats).toBe(true);

    // And hats don't trigger if mouse down is outside canvas
    ranClickHats = false;
    m.postData(Object.assign({}, mouseDownEvent, {
        x: 50000,
        y: 50
    }));
    expect(ranClickHats).toBe(false);
});
