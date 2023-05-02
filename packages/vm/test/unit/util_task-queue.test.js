const TaskQueue = require('../../src/util/task-queue');

const MockTimer = require('../fixtures/mock-timer');
const testCompare = require('../fixtures/test-compare');

// Max tokens = 1000
// Refill 1000 tokens per second (1 per millisecond)
// Token bucket starts empty
// Max total cost of queued tasks = 10000 tokens = 10 seconds
const makeTestQueue = () => {
    const bukkit = new TaskQueue(1000, 1000, {
        startingTokens: 0,
        maxTotalCost: 10000
    });

    const mockTimer = new MockTimer();
    bukkit._timer = mockTimer;
    mockTimer.start();

    return bukkit;
};

test('spec', () => {
    expect(typeof TaskQueue).toBe('function');
    const bukkit = makeTestQueue();

    expect(typeof bukkit).toBe('object');

    expect(typeof bukkit.length).toBe('number');
    expect(typeof bukkit.do).toBe('function');
    expect(typeof bukkit.cancel).toBe('function');
    expect(typeof bukkit.cancelAll).toBe('function');
});

test('constructor', () => {
    expect(new TaskQueue(1, 1)).toBeTruthy();
    expect(new TaskQueue(1, 1, {})).toBeTruthy();
    expect(new TaskQueue(1, 1, {startingTokens: 0})).toBeTruthy();
    expect(new TaskQueue(1, 1, {maxTotalCost: 999})).toBeTruthy();
    expect(new TaskQueue(1, 1, {startingTokens: 0, maxTotalCost: 999})).toBeTruthy();
});

test('run tasks', async done => {
    const bukkit = makeTestQueue();

    const taskResults = [];

    const promises = [
        bukkit.do(() => {
            taskResults.push('a');
            testCompare(bukkit._timer.timeElapsed(), '>=', 50, 'Costly task must wait');
        }, 50),
        bukkit.do(() => {
            taskResults.push('b');
            testCompare(bukkit._timer.timeElapsed(), '>=', 60, 'Tasks must run in serial');
        }, 10),
        bukkit.do(() => {
            taskResults.push('c');
            testCompare(bukkit._timer.timeElapsed(), '<=', 70, 'Cheap task should run soon');
        }, 1)
    ];

    // advance 10 simulated milliseconds per JS tick
    while (bukkit.length > 0) {
        await bukkit._timer.advanceMockTimeAsync(10);
    }

    return Promise.all(promises).then(() => {
        expect(taskResults).toEqual(['a', 'b', 'c']);
        done();
    });
});

test('cancel', async done => {
    const bukkit = makeTestQueue();

    const taskResults = [];
    const goodCancelMessage = 'Task was canceled correctly';
    const afterCancelMessage = 'Task was run correctly';
    const cancelTaskPromise = bukkit.do(
        () => {
            taskResults.push('nope');
        }, 999);
    const cancelCheckPromise = cancelTaskPromise.then(
        () => {
            done.fail('Task should have been canceled');
        },
        () => {
            taskResults.push(goodCancelMessage);
        }
    );
    const keepTaskPromise = bukkit.do(
        () => {
            taskResults.push(afterCancelMessage);
            testCompare(bukkit._timer.timeElapsed(), '<', 10, 'Canceled task must not delay other tasks');
        }, 5);

    // give the bucket a chance to make a mistake
    await bukkit._timer.advanceMockTimeAsync(1);

    expect(bukkit.length).toBe(2);
    const taskWasCanceled = bukkit.cancel(cancelTaskPromise);
    expect(taskWasCanceled).toBeTruthy();
    expect(bukkit.length).toBe(1);

    while (bukkit.length > 0) {
        await bukkit._timer.advanceMockTimeAsync(1);
    }

    return Promise.all([cancelCheckPromise, keepTaskPromise]).then(() => {
        expect(taskResults).toEqual([goodCancelMessage, afterCancelMessage]);
        done();
    });
});

test('cancelAll', async done => {
    const bukkit = makeTestQueue();

    const taskResults = [];
    const goodCancelMessage1 = 'Task1 was canceled correctly';
    const goodCancelMessage2 = 'Task2 was canceled correctly';

    const promises = [
        bukkit.do(() => taskResults.push('nope'), 999).then(
            () => {
                done.fail('Task1 should have been canceled');
            },
            () => {
                taskResults.push(goodCancelMessage1);
            }
        ),
        bukkit.do(() => taskResults.push('nah'), 999).then(
            () => {
                done.fail('Task2 should have been canceled');
            },
            () => {
                taskResults.push(goodCancelMessage2);
            }
        )
    ];

    // advance time, but not enough that any task should run
    await bukkit._timer.advanceMockTimeAsync(100);

    bukkit.cancelAll();

    // advance enough that both tasks would run if they hadn't been canceled
    await bukkit._timer.advanceMockTimeAsync(10000);

    return Promise.all(promises).then(() => {
        expect(taskResults).toEqual([goodCancelMessage1, goodCancelMessage2]);
        done();
    });
});

test('max total cost', async done => {
    const bukkit = makeTestQueue();

    let numTasks = 0;

    const task = () => ++numTasks;

    // Fill the queue
    for (let i = 0; i < 10; ++i) {
        bukkit.do(task, 1000);
    }

    // This one should be rejected because the queue is full
    bukkit
        .do(task, 1000)
        .then(
            () => {
                done.fail('Full queue did not reject task');
            },
            () => {
                done();
            }
        );

    while (bukkit.length > 0) {
        await bukkit._timer.advanceMockTimeAsync(1000);
    }

    // this should be 10 if the last task is rejected or 11 if it runs
    expect(numTasks).toBe(10);
});
