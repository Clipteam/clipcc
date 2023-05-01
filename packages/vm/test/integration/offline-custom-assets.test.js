/**
 * @fileoverview
 * This integration test ensures that a local upload of a sb2 project pulls
 * in assets correctly (from the provided .sb2 file) even if the assets
 * are not present on our servers.
 */
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const ScratchStorage = require('clipcc-storage');
const VirtualMachine = require('../../src/index');

const projectUri = path.resolve(__dirname, '../fixtures/offline-custom-assets.sb2');
const projectZip = AdmZip(projectUri);
const project = Buffer.from(fs.readFileSync(projectUri));
// Custom costume from sb2 file (which was downloaded from offline editor)
// This sound should not be available on our servers
const costume = projectZip.readFile('1.svg');
const costumeData = new Uint8Array(costume);
// Custom sound recording from sb2 file (which was downloaded from offline editor)
// This sound should not be available on our servers
const sound = projectZip.readFile('0.wav');
const soundData = new Uint8Array(sound);

test('offline-custom-assets', done => {
    const vm = new VirtualMachine();
    // Use a test storage here that does not have any web sources added to it.
    const testStorage = new ScratchStorage();
    vm.attachStorage(testStorage);

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        expect(threads.length === 0).toBeTruthy();
        vm.quit();
        done();
    });

    // Start VM, load project, and run
    expect(() => {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(project).then(() => {

            // Verify initial state
            expect(vm.runtime.targets.length).toBe(2);
            const costumes = vm.runtime.targets[1].getCostumes();
            expect(costumes.length).toBe(1);
            const customCostume = costumes[0];
            expect(customCostume.name).toBe('A_Test_Costume');

            const storedCostume = customCostume.asset;
            expect(typeof storedCostume).toBe('object');
            expect(storedCostume.data).toEqual(costumeData);

            const sounds = vm.runtime.targets[1].sprite.sounds;
            expect(sounds.length).toBe(1);
            const customSound = sounds[0];
            expect(customSound.name).toBe('A_Test_Recording');
            const storedSound = customSound.asset;
            expect(typeof storedSound).toBe('object');
            expect(storedSound.data).toEqual(soundData);

            vm.greenFlag();

            // After two seconds, get playground data and stop
            setTimeout(() => {
                vm.getPlaygroundData();
                vm.stopAll();
            }, 2000);
        });
    }).not.toThrow();

});
