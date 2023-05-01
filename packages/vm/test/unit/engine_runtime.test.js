const path = require('path');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/virtual-machine');
const Runtime = require('../../src/engine/runtime');
const MonitorRecord = require('../../src/engine/monitor-record');
const {Map} = require('immutable');

const test = tap.test;

test('spec', t => {
    const r = new Runtime();

    expect(typeof Runtime).toBe('function');
    expect(typeof r).toBe('object');

    // Test types of cloud data managing functions
    expect(typeof r.hasCloudData).toBe('function');
    expect(typeof r.canAddCloudVariable).toBe('function');
    expect(typeof r.addCloudVariable).toBe('function');
    expect(typeof r.removeCloudVariable).toBe('function');

    expect(r instanceof Runtime).toBeTruthy();

    t.end();
});

test('monitorStateEquals', t => {
    const r = new Runtime();
    const id = 'xklj4#!';
    const prevMonitorState = MonitorRecord({
        id,
        opcode: 'turtle whereabouts',
        value: '25'
    });
    const newMonitorDelta = Map({
        id,
        value: String(25)
    });
    r.requestAddMonitor(prevMonitorState);
    r.requestUpdateMonitor(newMonitorDelta);

    expect(true).toBe(prevMonitorState === r._monitorState.get(id));
    expect(String(25)).toBe(r._monitorState.get(id).get('value'));
    t.end();
});

test('monitorStateDoesNotEqual', t => {
    const r = new Runtime();
    const id = 'xklj4#!';
    const params = {seven: 7};
    const prevMonitorState = MonitorRecord({
        id,
        opcode: 'turtle whereabouts',
        value: '25'
    });

    // Value change
    let newMonitorDelta = Map({
        id,
        value: String(24)
    });
    r.requestAddMonitor(prevMonitorState);
    r.requestUpdateMonitor(newMonitorDelta);

    expect(false).toBe(prevMonitorState.equals(r._monitorState.get(id)));
    expect(String(24)).toBe(r._monitorState.get(id).get('value'));

    // Prop change
    newMonitorDelta = Map({
        id: 'xklj4#!',
        params: params
    });
    r.requestUpdateMonitor(newMonitorDelta);

    expect(false).toBe(prevMonitorState.equals(r._monitorState.get(id)));
    expect(String(24)).toBe(r._monitorState.get(id).value);
    expect(params).toBe(r._monitorState.get(id).params);

    t.end();
});

test('getLabelForOpcode', t => {
    const r = new Runtime();

    const fakeExtension = {
        id: 'fakeExtension',
        name: 'Fake Extension',
        blocks: [
            {
                info: {
                    opcode: 'foo',
                    json: {},
                    text: 'Foo',
                    xml: ''
                }
            },
            {
                info: {
                    opcode: 'foo_2',
                    json: {},
                    text: 'Foo 2',
                    xml: ''
                }
            }
        ]
    };

    r._blockInfo.push(fakeExtension);

    const result1 = r.getLabelForOpcode('fakeExtension_foo');
    expect(typeof result1.category).toBe('string');
    expect(typeof result1.label).toBe('string');
    expect(result1.label).toBe('Fake Extension: Foo');

    const result2 = r.getLabelForOpcode('fakeExtension_foo_2');
    expect(typeof result2.category).toBe('string');
    expect(typeof result2.label).toBe('string');
    expect(result2.label).toBe('Fake Extension: Foo 2');

    t.end();
});

test('Project loaded emits runtime event', t => {
    const vm = new VirtualMachine();
    const projectUri = path.resolve(__dirname, '../fixtures/default.sb2');
    const project = readFileToBuffer(projectUri);
    let projectLoaded = false;

    vm.runtime.addListener('PROJECT_LOADED', () => {
        projectLoaded = true;
    });

    vm.loadProject(project).then(() => {
        expect(projectLoaded).toBe(true);
        t.end();
    });
});

test('Cloud variable limit allows only 10 cloud variables', t => {
    // This is a test of just the cloud variable limit mechanism
    // The functions being tested below need to be used when
    // creating and deleting cloud variables in the runtime.

    const rt = new Runtime();

    expect(rt.hasCloudData()).toBe(false);

    for (let i = 0; i < 10; i++) {
        expect(rt.canAddCloudVariable()).toBe(true);
        rt.addCloudVariable();
        // Adding a cloud variable should change the
        // result of the hasCloudData check
        expect(rt.hasCloudData()).toBe(true);
    }


    // We should be at the cloud variable limit now
    expect(rt.canAddCloudVariable()).toBe(false);

    // Removing a cloud variable should allow the addition of exactly one more
    // when we are at the cloud variable limit
    rt.removeCloudVariable();

    expect(rt.canAddCloudVariable()).toBe(true);
    rt.addCloudVariable();
    expect(rt.canAddCloudVariable()).toBe(false);

    // Disposing of the runtime should reset the cloud variable limitations
    rt.dispose();
    expect(rt.hasCloudData()).toBe(false);

    for (let i = 0; i < 10; i++) {
        expect(rt.canAddCloudVariable()).toBe(true);
        rt.addCloudVariable();
        expect(rt.hasCloudData()).toBe(true);
    }

    // We should be at the cloud variable limit now
    expect(rt.canAddCloudVariable()).toBe(false);

    t.end();

});

test('Starting the runtime emits an event', t => {
    let started = false;
    const rt = new Runtime();
    rt.addListener('RUNTIME_STARTED', () => {
        started = true;
    });
    rt.start();
    expect(started).toBe(true);
    rt.quit();
    t.end();
});

test('Runtime cannot be started while already running', t => {
    const rt = new Runtime();
    rt.start(); // Start the first time

    // Set up a flag/listener to check if it can be started again
    let started = false;
    rt.addListener('RUNTIME_STARTED', () => {
        started = true;
    });

    // Starting again should not emit another event
    rt.start();
    expect(started).toBe(false);
    rt.quit();
    t.end();
});

test('setCompatibilityMode restarts if it was already running', t => {
    const rt = new Runtime();
    rt.start(); // Start the first time

    // Set up a flag/listener to check if it gets started again
    let started = false;
    rt.addListener('RUNTIME_STARTED', () => {
        started = true;
    });

    rt.setCompatibilityMode(true);
    expect(started).toBe(true);
    rt.quit();
    t.end();
});

test('setCompatibilityMode does not restart if it was not running', t => {
    const rt = new Runtime();

    let started = false;
    rt.addListener('RUNTIME_STARTED', () => {
        started = true;
    });

    rt.setCompatibilityMode(true);
    expect(started).toBe(false);
    t.end();
});

test('Disposing the runtime emits an event', t => {
    let disposed = false;
    const rt = new Runtime();
    rt.addListener('RUNTIME_DISPOSED', () => {
        disposed = true;
    });
    rt.dispose();
    expect(disposed).toBe(true);
    t.end();
});

test('Clock is reset on runtime dispose', t => {
    const rt = new Runtime();
    const c = rt.ioDevices.clock;
    let simulatedTime = 0;

    c._projectTimer = {
        timeElapsed: () => simulatedTime,
        start: () => {
            simulatedTime = 0;
        }
    };

    expect(c.projectTimer() === 0).toBeTruthy();
    simulatedTime += 1000;
    expect(c.projectTimer() === 1).toBeTruthy();
    rt.dispose();
    // When the runtime is disposed, the clock should be reset
    expect(c.projectTimer() === 0).toBeTruthy();
    t.end();
});
