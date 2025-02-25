/* eslint-disable no-console */
const path = require('path');
const process = require('process');

const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

/**
* @fileoverview Test vm's performance.
*/

let averageTime = -1;

const whenTaskComplete = () =>
    // When the number of threads reaches 0 the test is expected to be complete.
    new Promise(resolve => {
        setInterval(() => {
            if (averageTime !== -1) resolve();
        }, 50);
    })
;

const reportVmResult = text => {
    const separatorIndex = text.indexOf(' ');
    const command = text.substring(0, separatorIndex);
    const value = text.substring(separatorIndex + 1);
    switch (command) {
    case 'finished':
        averageTime = value;
        break;
    case 'invaild':
        throw new Error(`invaild quicksort result: ${value}`);
    default:
        console.log(`${command} ${value}`);
    }
};

const filePath = path.resolve(__dirname, '../fixtures/performance-test.sb3');
const vm = new VirtualMachine();
vm.attachStorage(makeTestStorage());

// Start the VM and initialize some vm properties.
// complete.
vm.start();
vm.clear();
vm.setCompatibilityMode(false);
vm.setTurboMode(false);

// Report the text of SAY events as testing instructions.
vm.runtime.on('SAY', (target, type, text) => reportVmResult(text));

console.log('50k items qsort performance test\n');

const project = readFileToBuffer(filePath);

// Load the project and once all threads are complete ensure that
// the scratch project sent us a "end" message.
return vm.loadProject(project)
    .then(() => vm.greenFlag())
    .then(() => whenTaskComplete())
    .then(() => {
        vm.quit();
        console.log(`test finished! average time is ${averageTime}`);
        process.exit(0);
    });
