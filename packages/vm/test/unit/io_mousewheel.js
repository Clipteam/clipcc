const MouseWheel = require('../../src/io/mouseWheel');
const Runtime = require('../../src/engine/runtime');

test('spec', () => {
    const rt = new Runtime();
    const mw = new MouseWheel(rt);

    expect(typeof mw).toBe('object');
    expect(typeof mw.postData).toBe('function');
});

test('blocks activated by scrolling', () => {
    let _startHatsArgs;
    const rt = {
        startHats: (...args) => {
            _startHatsArgs = args;
        }
    };
    const mw = new MouseWheel(rt);

    _startHatsArgs = null;
    mw.postData({
        deltaY: -1
    });
    expect(_startHatsArgs[0]).toBe('event_whenkeypressed');
    expect(_startHatsArgs[1].KEY_OPTION).toBe('up arrow');

    _startHatsArgs = null;
    mw.postData({
        deltaY: +1
    });
    expect(_startHatsArgs[0]).toBe('event_whenkeypressed');
    expect(_startHatsArgs[1].KEY_OPTION).toBe('down arrow');

    _startHatsArgs = null;
    mw.postData({
        deltaY: 0
    });
    expect(_startHatsArgs).toBe(null);
});
