const Sensing = require('../../src/blocks/scratch3_sensing');
const Runtime = require('../../src/engine/runtime');
const Sprite = require('../../src/sprites/sprite');
const RenderedTarget = require('../../src/sprites/rendered-target');
const BlockUtility = require('../../src/engine/block-utility');

test('getPrimitives', () => {
    const rt = new Runtime();
    const s = new Sensing(rt);
    expect(typeof s.getPrimitives()).toBe('object');
});

test('ask and answer with a hidden target', done => {
    const rt = new Runtime();
    const s = new Sensing(rt);
    const util = {target: {visible: false}};

    const expectedQuestion = 'a question';
    const expectedAnswer = 'the answer';

    // Test is written out of order because of promises, follow the (#) comments.
    rt.addListener('QUESTION', question => {
        // (2) Assert the question is correct, then emit the answer
        expect(question).toBe(expectedQuestion);
        rt.emit('ANSWER', expectedAnswer);
    });

    // (1) Emit the question.
    const promise = s.askAndWait({QUESTION: expectedQuestion}, util);

    // (3) Ask block resolves after the answer is emitted.
    promise.then(() => {
        expect(s.getAnswer()).toBe(expectedAnswer);
        done();
    });
});

test('ask and stop all dismisses question', done => {
    const rt = new Runtime();
    const s = new Sensing(rt);
    const util = {target: {visible: false}};

    const expectedQuestion = 'a question';

    let call = 0;

    rt.addListener('QUESTION', question => {
        if (call === 0) {
            // (2) Assert the question was passed.
            expect(question).toBe(expectedQuestion);
        } else if (call === 1) {
            // (4) Assert the question was dismissed.
            expect(question).toBe(null);
            done();
        }
        call += 1;
    });

    // (1) Emit the question.
    s.askAndWait({QUESTION: expectedQuestion}, util);
    // (3) Emit the stop all event.
    rt.stopAll();
});

test('ask and stop other scripts dismisses if it is the last question', done => {
    const rt = new Runtime();
    const s = new Sensing(rt);
    const util = {target: {visible: false, sprite: {}, getCustomState: () => ({})}, thread: {}};

    const expectedQuestion = 'a question';

    let call = 0;

    rt.addListener('QUESTION', question => {
        if (call === 0) {
            // (2) Assert the question was passed.
            expect(question).toBe(expectedQuestion);
        } else if (call === 1) {
            // (4) Assert the question was dismissed.
            expect(question).toBe(null);
            done();
        }
        call += 1;
    });

    // (1) Emit the questions.
    s.askAndWait({QUESTION: expectedQuestion}, util);
    // (3) Emit the stop for target event.
    rt.stopForTarget(util.target, util.thread);
});

test('ask and stop other scripts asks next question', done => {
    const rt = new Runtime();
    const s = new Sensing(rt);
    const util = {target: {visible: false, sprite: {}, getCustomState: () => ({})}, thread: {}};
    const util2 = {target: {visible: false, sprite: {}, getCustomState: () => ({})}, thread: {}};

    const expectedQuestion = 'a question';
    const nextQuestion = 'a followup';

    let call = 0;

    rt.addListener('QUESTION', question => {
        if (call === 0) {
            // (2) Assert the question was passed.
            expect(question).toBe(expectedQuestion);
        } else if (call === 1) {
            // (4) Assert the next question was passed.
            expect(question).toBe(nextQuestion);
            done();
        }
        call += 1;
    });

    // (1) Emit the questions.
    s.askAndWait({QUESTION: expectedQuestion}, util);
    s.askAndWait({QUESTION: nextQuestion}, util2);
    // (3) Emit the stop for target event.
    rt.stopForTarget(util.target, util.thread);
});

test('ask and answer with a visible target', done => {
    const rt = new Runtime();
    const s = new Sensing(rt);
    const util = {target: {visible: true}};

    const expectedQuestion = 'a question';
    const expectedAnswer = 'the answer';

    rt.removeAllListeners('SAY'); // Prevent say blocks from executing

    rt.addListener('SAY', (target, type, question) => {
        // Should emit SAY with the question
        expect(question).toBe(expectedQuestion);
    });

    rt.addListener('QUESTION', question => {
        // Question should be blank for a visible target
        expect(question).toBe('');

        // Remove the say listener and add a new one to assert bubble is cleared
        // by setting say to empty string after answer is received.
        rt.removeAllListeners('SAY');
        rt.addListener('SAY', (target, type, text) => {
            expect(text).toBe('');
            done();
        });
        rt.emit('ANSWER', expectedAnswer);
    });

    s.askAndWait({QUESTION: expectedQuestion}, util);
});

test('answer gets reset when runtime is disposed', done => {
    const rt = new Runtime();
    const s = new Sensing(rt);
    const util = {target: {visible: false}};
    const expectedAnswer = 'the answer';

    rt.addListener('QUESTION', () => rt.emit('ANSWER', expectedAnswer));
    const promise = s.askAndWait({QUESTION: ''}, util);

    promise.then(() => expect(s.getAnswer()).toBe(expectedAnswer))
        .then(() => rt.dispose())
        .then(() => {
            expect(s.getAnswer()).toBe('');
            done();
        });
});

test('set drag mode', () => {
    const runtime = new Runtime();
    runtime.requestTargetsUpdate = () => {}; // noop for testing
    const sensing = new Sensing(runtime);
    const s = new Sprite(null, runtime);
    const rt = new RenderedTarget(s, runtime);

    sensing.setDragMode({DRAG_MODE: 'not draggable'}, {target: rt});
    expect(rt.draggable).toBe(false);

    sensing.setDragMode({DRAG_MODE: 'draggable'}, {target: rt});
    expect(rt.draggable).toBe(true);
});

test('get loudness with caching', () => {
    const rt = new Runtime();
    const sensing = new Sensing(rt);

    // It should report -1 when audio engine is not available.
    expect(sensing.getLoudness()).toBe(-1);

    // Stub the audio engine with its getLoudness function, and set up different
    // values to simulate it changing over time.
    const firstLoudness = 1;
    const secondLoudness = 2;
    let simulatedLoudness = firstLoudness;
    rt.audioEngine = {getLoudness: () => simulatedLoudness};

    // It should report -1 when current step time is null.
    expect(sensing.getLoudness()).toBe(-1);

    // Stub the current step time.
    rt.currentStepTime = 1000 / 30;

    // The first time it works, it should report the result from the stubbed audio engine.
    expect(sensing.getLoudness()).toBe(firstLoudness);

    // Update the simulated loudness to a new value.
    simulatedLoudness = secondLoudness;

    // Simulate time passing by advancing the timer forward a little bit.
    // After less than a step, it should still report cached loudness.
    let simulatedTime = Date.now() + (rt.currentStepTime / 2);
    sensing._timer = {time: () => simulatedTime};
    expect(sensing.getLoudness()).toBe(firstLoudness);

    // Simulate more than a step passing. It should now request the value
    // from the audio engine again.
    simulatedTime += rt.currentStepTime;
    expect(sensing.getLoudness()).toBe(secondLoudness);
});

test('loud? boolean', () => {
    const rt = new Runtime();
    const sensing = new Sensing(rt);

    // The simplest way to test this is to actually override the getLoudness
    // method, which isLoud uses.
    let simulatedLoudness = 0;
    sensing.getLoudness = () => simulatedLoudness;
    expect(sensing.isLoud()).toBeFalsy();

    // Check for GREATER than 10, not equal.
    simulatedLoudness = 10;
    expect(sensing.isLoud()).toBeFalsy();

    simulatedLoudness = 11;
    expect(sensing.isLoud()).toBeTruthy();
});

test('get attribute of sprite variable', () => {
    const rt = new Runtime();
    const sensing = new Sensing(rt);
    const s = new Sprite(null, rt);
    const target = new RenderedTarget(s, rt);
    const variable = {
        name: 'cars',
        value: 'trucks',
        type: ''
    };
    // Add variable to set the map (it should be empty before this).
    target.variables.anId = variable;
    rt.getSpriteTargetByName = () => target;
    expect(sensing.getAttributeOf({PROPERTY: 'cars'})).toBe('trucks');
});
test('get attribute of variable that does not exist', () => {
    const rt = new Runtime();
    const sensing = new Sensing(rt);
    const s = new Sprite(null, rt);
    const target = new RenderedTarget(s, rt);
    rt.getTargetForStage = () => target;
    expect(sensing.getAttributeOf({PROPERTY: 'variableThatDoesNotExist'})).toBe(0);
});

test('username block', () => {
    const rt = new Runtime();
    const sensing = new Sensing(rt);
    const util = new BlockUtility(rt.sequencer);

    expect(sensing.getUsername({}, util)).toBe('');
});
