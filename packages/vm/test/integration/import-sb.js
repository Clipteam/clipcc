import path from 'path';
import {test} from '../fixtures/jest-tap-bridge.js';
import makeTestStorage from '../fixtures/make-test-storage.js';
import {readFileToBuffer} from '../fixtures/readProjectFile.js';
import VirtualMachine from '../../src/index.js';

const uri = path.resolve(__dirname, '../fixtures/single_sound.sb');
const project = readFileToBuffer(uri);

test('default', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        t.ok(threads.length === 0);
        vm.quit();
        t.end();
    });

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(project).then(() => {
            vm.greenFlag();

            const stageSounds = vm.runtime.targets[0].sprite.sounds;
            const firstSound = stageSounds[0];

            // Check that the sound has the correct md5
            // This md5 was obtained from the asset server
            t.equal(firstSound.md5, 'edb9713dedbe9a2e05c09e0540182ef1.wav');

            // After two seconds, get playground data and stop
            setTimeout(() => {
                vm.getPlaygroundData();
                vm.stopAll();
            }, 2000);
        });
    });
});
