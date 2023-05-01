const Control = require('../../src/blocks/scratch3_control');
const Runtime = require('../../src/engine/runtime');
const BlockUtility = require('../../src/engine/block-utility');

test('getPrimitives', () => {
    const rt = new Runtime();
    const c = new Control(rt);
    expect(typeof c.getPrimitives()).toBe('object');
});

test('repeat', () => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Test harness (mocks `util`)
    let i = 0;
    const repeat = 10;
    const util = {
        stackFrame: Object.create(null),
        startBranch: function () {
            i++;
            c.repeat({TIMES: repeat}, util);
        }
    };

    // Execute test
    c.repeat({TIMES: 10}, util);
    expect(util.stackFrame.loopCounter).toBe(-1);
    expect(i).toBe(repeat);
});

test('repeat rounds with round()', () => {
    const rt = new Runtime();
    const c = new Control(rt);

    const roundingTest = (inputForRepeat, expectedTimes) => {
        // Test harness (mocks `util`)
        let i = 0;
        const util = {
            stackFrame: Object.create(null),
            startBranch: function () {
                i++;
                c.repeat({TIMES: inputForRepeat}, util);
            }
        };

        // Execute test
        c.repeat({TIMES: inputForRepeat}, util);
        expect(i).toBe(expectedTimes);
    };

    // Execute tests
    roundingTest(3.2, 3);
    roundingTest(3.7, 4);
    roundingTest(3.5, 4);
});

test('repeatUntil', () => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Test harness (mocks `util`)
    let i = 0;
    const repeat = 10;
    const util = {
        stackFrame: Object.create(null),
        startBranch: function () {
            i++;
            c.repeatUntil({CONDITION: (i === repeat)}, util);
        }
    };

    // Execute test
    c.repeatUntil({CONDITION: (i === repeat)}, util);
    expect(i).toBe(repeat);
});

test('repeatWhile', () => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Test harness (mocks `util`)
    let i = 0;
    const repeat = 10;
    const util = {
        stackFrame: Object.create(null),
        startBranch: function () {
            i++;
            // Note !== instead of ===
            c.repeatWhile({CONDITION: (i !== repeat)}, util);
        }
    };

    // Execute test
    c.repeatWhile({CONDITION: (i !== repeat)}, util);
    expect(i).toBe(repeat);
});

test('forEach', () => {
    const rt = new Runtime();
    const c = new Control(rt);

    const variableValues = [];
    const variable = {value: 0};
    let value;
    const util = {
        stackFrame: Object.create(null),
        target: {
            lookupOrCreateVariable: function () {
                return variable;
            }
        },
        startBranch: function () {
            variableValues.push(variable.value);
            c.forEach({VARIABLE: {}, VALUE: value}, util);
        }
    };

    // for each (variable) in "5"
    // ..should yield variable values 1, 2, 3, 4, 5
    util.stackFrame = Object.create(null);
    variableValues.splice(0);
    variable.value = 0;
    value = '5';
    c.forEach({VARIABLE: {}, VALUE: value}, util);
    expect(variableValues).toEqual([1, 2, 3, 4, 5]);

    // for each (variable) in 4
    // ..should yield variable values 1, 2, 3, 4
    util.stackFrame = Object.create(null);
    variableValues.splice(0);
    variable.value = 0;
    value = 4;
    c.forEach({VARIABLE: {}, VALUE: value}, util);
    expect(variableValues).toEqual([1, 2, 3, 4]);
});

test('forever', () => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Test harness (mocks `util`)
    let i = 0;
    const util = {
        startBranch: function (branchNum, isLoop) {
            i++;
            expect(branchNum).toBe(1);
            expect(isLoop).toBe(true);
        }
    };

    // Execute test
    c.forever(null, util);
    expect(i).toBe(1);
});

test('if / ifElse', () => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Test harness (mocks `util`)
    let i = 0;
    const util = {
        startBranch: function (branchNum) {
            i += branchNum;
        }
    };

    // Execute test
    c.if({CONDITION: true}, util);
    expect(i).toBe(1);
    c.if({CONDITION: false}, util);
    expect(i).toBe(1);
    c.ifElse({CONDITION: true}, util);
    expect(i).toBe(2);
    c.ifElse({CONDITION: false}, util);
    expect(i).toBe(4);
});

test('stop', () => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Test harness (mocks `util`)
    const state = {
        stopAll: 0,
        stopOtherTargetThreads: 0,
        stopThisScript: 0
    };
    const util = {
        stopAll: function () {
            state.stopAll++;
        },
        stopOtherTargetThreads: function () {
            state.stopOtherTargetThreads++;
        },
        stopThisScript: function () {
            state.stopThisScript++;
        }
    };

    // Execute test
    c.stop({STOP_OPTION: 'all'}, util);
    c.stop({STOP_OPTION: 'other scripts in sprite'}, util);
    c.stop({STOP_OPTION: 'other scripts in stage'}, util);
    c.stop({STOP_OPTION: 'this script'}, util);
    expect(state.stopAll).toBe(1);
    expect(state.stopOtherTargetThreads).toBe(2);
    expect(state.stopThisScript).toBe(1);
});

test('counter, incrCounter, clearCounter', () => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Default value
    expect(c.getCounter()).toBe(0);

    c.incrCounter();
    c.incrCounter();
    expect(c.getCounter()).toBe(2);

    c.clearCounter();
    expect(c.getCounter()).toBe(0);
});

test('allAtOnce', () => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Test harness (mocks `util`)
    let ran = false;
    const util = {
        startBranch: function () {
            ran = true;
        }
    };

    // Execute test
    c.allAtOnce({}, util);
    expect(ran).toBeTruthy();
});

test('wait', () => {
    const rt = new Runtime();
    const c = new Control(rt);
    const args = {DURATION: .01};
    const waitTime = args.DURATION * 1000;
    const startTest = Date.now();
    const thresholdSmall = 1000 / 60; // only allow the wait to end one 60Hz frame early
    const thresholdLarge = 1000 / 3; // be less picky about when the wait ends, in case CPU load makes the VM run slowly
    let yields = 0;
    const util = new BlockUtility();
    const mockUtil = {
        stackFrame: {},
        yield: () => yields++,
        stackTimerNeedsInit: util.stackTimerNeedsInit,
        startStackTimer: util.startStackTimer,
        stackTimerFinished: util.stackTimerFinished
    };

    c.wait(args, mockUtil);
    expect(yields).toBe(1);

    // Spin the cpu until enough time passes
    let timeElapsed = 0;
    while (timeElapsed < waitTime) {
        timeElapsed = mockUtil.stackFrame.timer.timeElapsed();
        // In case util.timer is broken - have our own "exit"
        if (Date.now() - startTest > timeElapsed + thresholdSmall) {
            break;
        }
    }

    c.wait(args, mockUtil);
    expect(yields).toBe(1);
    expect(waitTime).toBe(mockUtil.stackFrame.duration);
    expect(timeElapsed >= (waitTime - thresholdSmall)).toBeTruthy();
    expect(timeElapsed <= (waitTime + thresholdLarge)).toBeTruthy();
});
