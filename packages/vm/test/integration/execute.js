const fs = require('fs');
const path = require('path');

const test = require('tap').test;

const log = require('../../src/util/log');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

/**
 * @fileoverview Transform each sb2 in fixtures/execute into a test.
 *
 * Test execution of a group of scratch blocks by SAYing if a test did "pass",
 * or did "fail". Four keywords can be set at the beginning of a SAY messaage
 * to indicate a test primitive.
 *
 * - "pass MESSAGE" will t.pass(MESSAGE).
 * - "fail MESSAGE" will t.fail(MESSAGE).
 * - "plan NUMBER_OF_TESTS" will t.plan(Number(NUMBER_OF_TESTS)).
 * - "end" will t.end().
 *
 * A good strategy to follow is to SAY "plan NUMBER_OF_TESTS" first. Then
 * "pass" and "fail" depending on expected scratch results in conditions, event
 * scripts, or what is best for testing the target block or group of blocks.
 * When its done you must SAY "end" so the test and tap know that the end has
 * been reached.
 */

const whenThreadsComplete = (vm, uri, timeLimit = 5000) =>
    // When the number of threads reaches 0 the test is expected to be complete.
    new Promise((resolve, reject) => {
        const intervalId = setInterval(() => {
            let active = 0;
            const threads = vm.runtime.threads;
            for (let i = 0; i < threads.length; i++) {
                if (!threads[i].updateMonitor) {
                    active += 1;
                }
            }
            if (active === 0) {
                clearInterval(intervalId);
                // eslint-disable-next-line no-use-before-define
                clearTimeout(timeoutId);
                resolve();
            }
        }, 50);

        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            reject(new Error(`Timeout waiting for threads to complete: ${uri}`));
        }, timeLimit);
    });

const executeDir = path.resolve(__dirname, '../fixtures/execute');

const testFiles = fs.readdirSync(executeDir)
    .filter(uri => uri.endsWith('.sb2') || uri.endsWith('.sb3'));

test('Execute Scratch projects', async t => {
    for (const uri of testFiles) {
        await t.test(uri, async t => {
            // Disable logging during this test.
            log.suggest.deny('vm', 'error');

            const vm = new VirtualMachine();

            // Map string messages to tap reporting methods. This will be used
            // with events from scratch's runtime emitted on block instructions.
            let didPlan = false;
            let didEnd = false;
            const reporters = {
                comment (message) {
                    t.comment(`[${path.basename(uri)}] ${message}`);
                },
                pass (reason) {
                    t.pass(`[${path.basename(uri)}] ${reason}`);
                },
                fail (reason) {
                    t.fail(`[${path.basename(uri)}] ${reason}`);
                },
                plan (count) {
                    didPlan = true;
                    t.plan(Number(count) + 1); // +1 for the implicit end check
                },
                end () {
                    didEnd = true;
                }
            };
            const reportVmResult = text => {
                const command = text.split(/\s+/, 1)[0].toLowerCase();
                if (reporters[command]) {
                    return reporters[command](text.substring(command.length).trim());
                }

                // Default to a comment with the full text if we didn't match
                // any command prefix
                return reporters.comment(text);
            };

            vm.attachStorage(makeTestStorage());

            // Start the VM and initialize some vm properties.
            vm.start();
            vm.clear();
            vm.setCompatibilityMode(false);
            vm.setTurboMode(false);

            // Report the text of SAY events as testing instructions.
            vm.runtime.on('SAY', (target, type, text) => reportVmResult(text));

            const project = readFileToBuffer(path.resolve(executeDir, uri));

            try {
                // Load the project and once all threads are complete ensure that
                // the scratch project sent us a "end" message.
                await vm.loadProject(project);
                await vm.greenFlag();
                await whenThreadsComplete(vm, uri);

                // Setting a plan is not required but is a good idea.
                if (!didPlan) {
                    t.comment('did not say "plan NUMBER_OF_TESTS"');
                }

                // Check if the test ended properly
                t.ok(didEnd, 'test ended properly');

            } catch (error) {
                t.fail(error.message);
            } finally {
                // Cleanup
                vm.stopAll();
                vm.clear();
                if (vm.runtime._steppingInterval) {
                    clearInterval(vm.runtime._steppingInterval);
                }
                log.suggest.clear();
            }
        });
    }
});
