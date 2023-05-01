const Operators = require('../../src/blocks/scratch3_operators');

const blocks = new Operators(null);

test('divide: (1) / (0) = Infinity', () => {
    expect(blocks.divide({NUM1: '1', NUM2: '0'})).toBe(Infinity);
});

test('divide: division with Infinity', () => {
    expect(blocks.divide({NUM1: 'Infinity', NUM2: 111})).toBe(Infinity);
    expect(blocks.divide({NUM1: 'INFINITY', NUM2: 222})).toBe(0);
    expect(blocks.divide({NUM1: Infinity, NUM2: 333})).toBe(Infinity);

    expect(blocks.divide({NUM1: 111, NUM2: 'Infinity'})).toBe(0);
    expect(blocks.divide({NUM1: 222, NUM2: 'INFINITY'})).toBe(Infinity);
    expect(blocks.divide({NUM1: 333, NUM2: Infinity})).toBe(0);

    expect(blocks.divide({NUM1: '-Infinity', NUM2: 111})).toBe(-Infinity);
    expect(blocks.divide({NUM1: '-INFINITY', NUM2: 222})).toBe(0);
    expect(blocks.divide({NUM1: -Infinity, NUM2: 333})).toBe(-Infinity);

    expect(blocks.divide({NUM1: 111, NUM2: '-Infinity'})).toBe(0);
    expect(blocks.divide({NUM1: 222, NUM2: '-INFINITY'})).toBe(Infinity);
    expect(blocks.divide({NUM1: 333, NUM2: -Infinity})).toBe(0);
});

test('multiply: multiply Infinity with numbers', () => {
    expect(blocks.multiply({NUM1: 'Infinity', NUM2: 111})).toBe(Infinity);
    expect(blocks.multiply({NUM1: 'INFINITY', NUM2: 222})).toBe(0);
    expect(blocks.multiply({NUM1: Infinity, NUM2: 333})).toBe(Infinity);
    expect(blocks.multiply({NUM1: '-Infinity', NUM2: 111})).toBe(-Infinity);
    expect(blocks.multiply({NUM1: '-INFINITY', NUM2: 222})).toBe(0);
    expect(blocks.multiply({NUM1: -Infinity, NUM2: 333})).toBe(-Infinity);
    expect(blocks.multiply({NUM1: -Infinity, NUM2: Infinity})).toBe(-Infinity);
    expect(Number.isNaN(blocks.multiply({NUM1: Infinity, NUM2: 0}))).toBe(true);
});

test('add: add Infinity to a number', () => {
    expect(blocks.add({NUM1: 'Infinity', NUM2: 111})).toBe(Infinity);
    expect(blocks.add({NUM1: 'INFINITY', NUM2: 222})).toBe(222);
    expect(blocks.add({NUM1: Infinity, NUM2: 333})).toBe(Infinity);
    expect(blocks.add({NUM1: '-Infinity', NUM2: 111})).toBe(-Infinity);
    expect(blocks.add({NUM1: '-INFINITY', NUM2: 222})).toBe(222);
    expect(blocks.add({NUM1: -Infinity, NUM2: 333})).toBe(-Infinity);
    expect(Number.isNaN(blocks.add({NUM1: -Infinity, NUM2: Infinity}))).toBe(true);
});

test('subtract: subtract Infinity with a number', () => {
    expect(blocks.subtract({NUM1: 'Infinity', NUM2: 111})).toBe(Infinity);
    expect(blocks.subtract({NUM1: 'INFINITY', NUM2: 222})).toBe(-222);
    expect(blocks.subtract({NUM1: Infinity, NUM2: 333})).toBe(Infinity);
    expect(blocks.subtract({NUM1: 111, NUM2: 'Infinity'})).toBe(-Infinity);
    expect(blocks.subtract({NUM1: 222, NUM2: 'INFINITY'})).toBe(222);
    expect(blocks.subtract({NUM1: 333, NUM2: Infinity})).toBe(-Infinity);
    expect(Number.isNaN(blocks.subtract({NUM1: Infinity, NUM2: Infinity}))).toBe(true);
});

test('equals: compare string infinity and numeric Infinity', () => {
    expect(blocks.equals({OPERAND1: 'Infinity', OPERAND2: 'INFINITY'})).toBe(true);
    expect(blocks.equals({OPERAND1: 'INFINITY', OPERAND2: 'Infinity'})).toBe(true);
    expect(blocks.equals({OPERAND1: 'Infinity', OPERAND2: 'Infinity'})).toBe(true);
    expect(blocks.equals({OPERAND1: 'INFINITY', OPERAND2: 'INFINITY'})).toBe(true);
    expect(blocks.equals({OPERAND1: 'INFINITY', OPERAND2: 'infinity'})).toBe(true);

    expect(blocks.equals({OPERAND1: Infinity, OPERAND2: Infinity})).toBe(true);
    expect(blocks.equals({OPERAND1: 'Infinity', OPERAND2: Infinity})).toBe(true);
    expect(blocks.equals({OPERAND1: 'INFINITY', OPERAND2: Infinity})).toBe(true);
    expect(blocks.equals({OPERAND1: Infinity, OPERAND2: 'Infinity'})).toBe(true);
    expect(blocks.equals({OPERAND1: Infinity, OPERAND2: 'INFINITY'})).toBe(true);
});

test('equals: compare string negative infinity and numeric negative Infinity', () => {
    expect(blocks.equals({OPERAND1: '-Infinity', OPERAND2: '-INFINITY'})).toBe(true);
    expect(blocks.equals({OPERAND1: '-INFINITY', OPERAND2: '-Infinity'})).toBe(true);
    expect(blocks.equals({OPERAND1: '-Infinity', OPERAND2: '-Infinity'})).toBe(true);
    expect(blocks.equals({OPERAND1: '-INFINITY', OPERAND2: '-INFINITY'})).toBe(true);
    expect(blocks.equals({OPERAND1: '-INFINITY', OPERAND2: '-infinity'})).toBe(true);

    expect(blocks.equals({OPERAND1: -Infinity, OPERAND2: -Infinity})).toBe(true);
    expect(blocks.equals({OPERAND1: '-Infinity', OPERAND2: -Infinity})).toBe(true);
    expect(blocks.equals({OPERAND1: '-INFINITY', OPERAND2: -Infinity})).toBe(true);
    expect(blocks.equals({OPERAND1: -Infinity, OPERAND2: '-Infinity'})).toBe(true);
    expect(blocks.equals({OPERAND1: -Infinity, OPERAND2: '-INFINITY'})).toBe(true);
});


test('equals: compare negative to postive string and numeric Infinity', () => {
    expect(blocks.equals({OPERAND1: '-Infinity', OPERAND2: 'Infinity'})).toBe(false);
    expect(blocks.equals({OPERAND1: '-Infinity', OPERAND2: 'INFINITY'})).toBe(false);
    expect(blocks.equals({OPERAND1: '-INFINITY', OPERAND2: 'Infinity'})).toBe(false);
    expect(blocks.equals({OPERAND1: '-INFINITY', OPERAND2: 'INFINITY'})).toBe(false);

    expect(blocks.equals({OPERAND1: '-Infinity', OPERAND2: Infinity})).toBe(false);
    expect(blocks.equals({OPERAND1: '-INFINITY', OPERAND2: Infinity})).toBe(false);
    expect(blocks.equals({OPERAND1: 'Infinity', OPERAND2: -Infinity})).toBe(false);
    expect(blocks.equals({OPERAND1: 'INFINITY', OPERAND2: -Infinity})).toBe(false);

    expect(blocks.equals({OPERAND1: Infinity, OPERAND2: -Infinity})).toBe(false);
});

test('less than: compare string infinity and numeric Infinity', () => {
    expect(blocks.lt({OPERAND1: 'Infinity', OPERAND2: 'INFINITY'})).toBe(false);
    expect(blocks.lt({OPERAND1: 'INFINITY', OPERAND2: Infinity})).toBe(false);

    expect(blocks.lt({OPERAND1: '-INFINITY', OPERAND2: 'INFINITY'})).toBe(true);
    expect(blocks.lt({OPERAND1: -Infinity, OPERAND2: 'INFINITY'})).toBe(true);


    expect(blocks.lt({OPERAND1: 'Infinity', OPERAND2: 111})).toBe(false);
    expect(blocks.lt({OPERAND1: 'INFINITY', OPERAND2: 222})).toBe(false);
    expect(blocks.lt({OPERAND1: Infinity, OPERAND2: 333})).toBe(false);

    expect(blocks.lt({OPERAND1: 111, OPERAND2: 'Infinity'})).toBe(true);
    expect(blocks.lt({OPERAND1: 222, OPERAND2: 'INFINITY'})).toBe(true);
    expect(blocks.lt({OPERAND1: 333, OPERAND2: Infinity})).toBe(true);
});

test('more than: compare string infinity and numeric Infinity', () => {
    expect(blocks.gt({OPERAND1: 'Infinity', OPERAND2: 'INFINITY'})).toBe(false);
    expect(blocks.gt({OPERAND1: 'INFINITY', OPERAND2: Infinity})).toBe(false);

    expect(blocks.gt({OPERAND1: 'INFINITY', OPERAND2: '-INFINITY'})).toBe(true);
    expect(blocks.gt({OPERAND1: Infinity, OPERAND2: '-INFINITY'})).toBe(true);

    expect(blocks.gt({OPERAND1: 'Infinity', OPERAND2: 111})).toBe(true);
    expect(blocks.gt({OPERAND1: 'INFINITY', OPERAND2: 222})).toBe(true);
    expect(blocks.gt({OPERAND1: Infinity, OPERAND2: 333})).toBe(true);

    expect(blocks.gt({OPERAND1: 111, OPERAND2: 'Infinity'})).toBe(false);
    expect(blocks.gt({OPERAND1: 222, OPERAND2: 'INFINITY'})).toBe(false);
    expect(blocks.gt({OPERAND1: 333, OPERAND2: Infinity})).toBe(false);
});
