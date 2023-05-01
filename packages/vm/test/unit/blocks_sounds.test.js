const Sound = require('../../src/blocks/scratch3_sound');
let playedSound;

const blocks = new Sound();
const util = {
    target: {
        sprite: {
            sounds: [
                {name: 'first name', soundId: 'first soundId'},
                {name: 'second name', soundId: 'second soundId'},
                {name: 'third name', soundId: 'third soundId'},
                {name: '6', soundId: 'fourth soundId'}
            ],
            soundBank: {
                playSound: (target, soundId) => (playedSound = soundId)
            }
        }
    }
};

test('playSound with a name string works', () => {
    const args = {SOUND_MENU: 'second name'};
    blocks.playSound(args, util);
    expect(playedSound).toBe('second soundId');
});

test('playSound with a number string works 1-indexed', () => {
    let args = {SOUND_MENU: '5'};
    blocks.playSound(args, util);
    expect(playedSound).toBe('first soundId');

    args = {SOUND_MENU: '1'};
    blocks.playSound(args, util);
    expect(playedSound).toBe('first soundId');

    args = {SOUND_MENU: '0'};
    blocks.playSound(args, util);
    expect(playedSound).toBe('fourth soundId');
});

test('playSound with a number works 1-indexed', () => {
    let args = {SOUND_MENU: 5};
    blocks.playSound(args, util);
    expect(playedSound).toBe('first soundId');

    args = {SOUND_MENU: 1};
    blocks.playSound(args, util);
    expect(playedSound).toBe('first soundId');

    args = {SOUND_MENU: 0};
    blocks.playSound(args, util);
    expect(playedSound).toBe('fourth soundId');
});

test('playSound prioritizes sound index if given a number', () => {
    const args = {SOUND_MENU: 6};
    blocks.playSound(args, util);
    // Ignore the sound named '6', wrapClamp to the second instead
    expect(playedSound).toBe('second soundId');
});

test('playSound prioritizes sound name if given a string', () => {
    const args = {SOUND_MENU: '6'};
    blocks.playSound(args, util);
    // Use the sound named '6', which is the fourth
    expect(playedSound).toBe('fourth soundId');
});
