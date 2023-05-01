const maybeFormatMessage = require('../../src/util/maybe-format-message');

const nonMessages = [
    'hi',
    42,
    true,
    function () {
        return 'unused';
    },
    {
        a: 1,
        b: 2
    },
    {
        id: 'almost a message',
        notDefault: 'but missing the "default" property'
    },
    {
        notId: 'this one is missing the "id" property',
        default: 'but has "default"'
    }
];

const argsQuick = {
    speed: 'quick'
};

const argsOther = {
    speed: 'slow'
};

const argsEmpty = {};

const simpleMessage = {
    id: 'test.simpleMessage',
    default: 'The quick brown fox jumped over the lazy dog.'
};

const complexMessage = {
    id: 'test.complexMessage',
    default: '{speed, select, quick {The quick brown fox jumped over the lazy dog.} other {Too slow, Gobo!}}'
};

const quickExpectedResult = 'The quick brown fox jumped over the lazy dog.';
const otherExpectedResult = 'Too slow, Gobo!';

test('preserve non-messages', () => {
    expect.assertions(nonMessages.length);

    for (const x of nonMessages) {
        const result = maybeFormatMessage(x);
        t.strictSame(x, result);
    }
});

test('format messages', () => {
    const quickResult1 = maybeFormatMessage(simpleMessage);
    t.strictNotSame(quickResult1, simpleMessage);
    expect(quickResult1).toEqual(quickExpectedResult);

    const quickResult2 = maybeFormatMessage(complexMessage, argsQuick);
    t.strictNotSame(quickResult2, complexMessage);
    expect(quickResult2).toEqual(quickExpectedResult);

    const otherResult1 = maybeFormatMessage(complexMessage, argsOther);
    t.strictNotSame(otherResult1, complexMessage);
    expect(otherResult1).toEqual(otherExpectedResult);

    const otherResult2 = maybeFormatMessage(complexMessage, argsEmpty);
    t.strictNotSame(otherResult2, complexMessage);
    expect(otherResult2).toEqual(otherExpectedResult);
});
