const Operators = require('../../src/blocks/scratch3_operators');

const blocks = new Operators(null);

test('getPrimitives', () => {
    expect(typeof blocks.getPrimitives()).toBe('object');
});

test('add', () => {
    expect(blocks.add({NUM1: '1', NUM2: '1'})).toBe(2);
    expect(blocks.add({NUM1: 'foo', NUM2: 'bar'})).toBe(0);
});

test('subtract', () => {
    expect(blocks.subtract({NUM1: '1', NUM2: '1'})).toBe(0);
    expect(blocks.subtract({NUM1: 'foo', NUM2: 'bar'})).toBe(0);
});

test('multiply', () => {
    expect(blocks.multiply({NUM1: '2', NUM2: '2'})).toBe(4);
    expect(blocks.multiply({NUM1: 'foo', NUM2: 'bar'})).toBe(0);
});

test('divide', () => {
    expect(blocks.divide({NUM1: '2', NUM2: '2'})).toBe(1);
    expect(isNaN(blocks.divide({NUM1: 'foo', NUM2: 'bar'}))).toBeTruthy(); // @todo
});

test('lt', () => {
    expect(blocks.lt({OPERAND1: '1', OPERAND2: '2'})).toBe(true);
    expect(blocks.lt({OPERAND1: '2', OPERAND2: '1'})).toBe(false);
    expect(blocks.lt({OPERAND1: '1', OPERAND2: '1'})).toBe(false);
    expect(blocks.lt({OPERAND1: '10', OPERAND2: '2'})).toBe(false);
    expect(blocks.lt({OPERAND1: 'a', OPERAND2: 'z'})).toBe(true);
});

test('equals', () => {
    expect(blocks.equals({OPERAND1: '1', OPERAND2: '2'})).toBe(false);
    expect(blocks.equals({OPERAND1: '2', OPERAND2: '1'})).toBe(false);
    expect(blocks.equals({OPERAND1: '1', OPERAND2: '1'})).toBe(true);
    expect(blocks.equals({OPERAND1: 'あ', OPERAND2: 'ア'})).toBe(false);
});

test('gt', () => {
    expect(blocks.gt({OPERAND1: '1', OPERAND2: '2'})).toBe(false);
    expect(blocks.gt({OPERAND1: '2', OPERAND2: '1'})).toBe(true);
    expect(blocks.gt({OPERAND1: '1', OPERAND2: '1'})).toBe(false);
});

test('and', () => {
    expect(blocks.and({OPERAND1: true, OPERAND2: true})).toBe(true);
    expect(blocks.and({OPERAND1: true, OPERAND2: false})).toBe(false);
    expect(blocks.and({OPERAND1: false, OPERAND2: false})).toBe(false);
});

test('or', () => {
    expect(blocks.or({OPERAND1: true, OPERAND2: true})).toBe(true);
    expect(blocks.or({OPERAND1: true, OPERAND2: false})).toBe(true);
    expect(blocks.or({OPERAND1: false, OPERAND2: false})).toBe(false);
});

test('not', () => {
    expect(blocks.not({OPERAND: true})).toBe(false);
    expect(blocks.not({OPERAND: false})).toBe(true);
});

test('random', () => {
    const min = 0;
    const max = 100;
    const result = blocks.random({FROM: min, TO: max});
    expect(result >= min).toBeTruthy();
    expect(result <= max).toBeTruthy();
});

test('random - equal', () => {
    const min = 1;
    const max = 1;
    expect(blocks.random({FROM: min, TO: max})).toBe(min);
});

test('random - decimal', () => {
    const min = 0.1;
    const max = 10;
    const result = blocks.random({FROM: min, TO: max});
    expect(result >= min).toBeTruthy();
    expect(result <= max).toBeTruthy();
});

test('random - int', () => {
    const min = 0;
    const max = 10;
    const result = blocks.random({FROM: min, TO: max});
    expect(result >= min).toBeTruthy();
    expect(result <= max).toBeTruthy();
});

test('random - reverse', () => {
    const min = 0;
    const max = 10;
    const result = blocks.random({FROM: max, TO: min});
    expect(result >= min).toBeTruthy();
    expect(result <= max).toBeTruthy();
});

test('join', () => {
    expect(blocks.join({STRING1: 'foo', STRING2: 'bar'})).toBe('foobar');
    expect(blocks.join({STRING1: '1', STRING2: '2'})).toBe('12');
});

test('letterOf', () => {
    expect(blocks.letterOf({STRING: 'foo', LETTER: 0})).toBe('');
    expect(blocks.letterOf({STRING: 'foo', LETTER: 1})).toBe('f');
    expect(blocks.letterOf({STRING: 'foo', LETTER: 2})).toBe('o');
    expect(blocks.letterOf({STRING: 'foo', LETTER: 3})).toBe('o');
    expect(blocks.letterOf({STRING: 'foo', LETTER: 4})).toBe('');
    expect(blocks.letterOf({STRING: 'foo', LETTER: 'bar'})).toBe('');
});

test('length', () => {
    expect(blocks.length({STRING: ''})).toBe(0);
    expect(blocks.length({STRING: 'foo'})).toBe(3);
    expect(blocks.length({STRING: '1'})).toBe(1);
    expect(blocks.length({STRING: '100'})).toBe(3);
});

test('contains', () => {
    expect(blocks.contains({STRING1: 'hello world', STRING2: 'hello'})).toBe(true);
    expect(blocks.contains({STRING1: 'foo', STRING2: 'bar'})).toBe(false);
    expect(blocks.contains({STRING1: 'HeLLo world', STRING2: 'hello'})).toBe(true);
});

test('mod', () => {
    expect(blocks.mod({NUM1: 1, NUM2: 1})).toBe(0);
    expect(blocks.mod({NUM1: 3, NUM2: 6})).toBe(3);
    expect(blocks.mod({NUM1: -3, NUM2: 6})).toBe(3);
});

test('round', () => {
    expect(blocks.round({NUM: 1})).toBe(1);
    expect(blocks.round({NUM: 1.1})).toBe(1);
    expect(blocks.round({NUM: 1.5})).toBe(2);
});

test('mathop', () => {
    expect(blocks.mathop({OPERATOR: 'abs', NUM: -1})).toBe(1);
    expect(blocks.mathop({OPERATOR: 'floor', NUM: 1.5})).toBe(1);
    expect(blocks.mathop({OPERATOR: 'ceiling', NUM: 0.1})).toBe(1);
    expect(blocks.mathop({OPERATOR: 'sqrt', NUM: 1})).toBe(1);
    expect(blocks.mathop({OPERATOR: 'sin', NUM: 1})).toBe(0.0174524064);
    expect(blocks.mathop({OPERATOR: 'sin', NUM: 90})).toBe(1);
    expect(blocks.mathop({OPERATOR: 'cos', NUM: 1})).toBe(0.9998476952);
    expect(blocks.mathop({OPERATOR: 'cos', NUM: 180})).toBe(-1);
    expect(blocks.mathop({OPERATOR: 'tan', NUM: 1})).toBe(0.0174550649);
    expect(blocks.mathop({OPERATOR: 'tan', NUM: 90})).toBe(Infinity);
    expect(blocks.mathop({OPERATOR: 'tan', NUM: 180})).toBe(0);
    expect(blocks.mathop({OPERATOR: 'asin', NUM: 1})).toBe(90);
    expect(blocks.mathop({OPERATOR: 'acos', NUM: 1})).toBe(0);
    expect(blocks.mathop({OPERATOR: 'atan', NUM: 1})).toBe(45);
    expect(blocks.mathop({OPERATOR: 'ln', NUM: 1})).toBe(0);
    expect(blocks.mathop({OPERATOR: 'log', NUM: 1})).toBe(0);
    expect(blocks.mathop({OPERATOR: 'e ^', NUM: 1})).toBe(2.718281828459045);
    expect(blocks.mathop({OPERATOR: '10 ^', NUM: 1})).toBe(10);
    expect(blocks.mathop({OPERATOR: 'undefined', NUM: 1})).toBe(0);
});

test('power', () => {
    expect(blocks.power({NUM1: 2, NUM2: 0})).toBe(1);
    expect(blocks.power({NUM1: 5, NUM2: -1})).toBe(0.2);
    expect(blocks.power({NUM1: 4, NUM2: 0.5})).toBe(2);
});

// @todo bit operation blocks

test('le', () => {
    expect(blocks.le({OPERAND1: '1', OPERAND2: '2'})).toBe(true);
    expect(blocks.le({OPERAND1: '2', OPERAND2: '1'})).toBe(false);
    expect(blocks.le({OPERAND1: '1', OPERAND2: '1'})).toBe(true);
    expect(blocks.le({OPERAND1: '10', OPERAND2: '2'})).toBe(false);
    expect(blocks.le({OPERAND1: 'a', OPERAND2: 'z'})).toBe(true);
});

test('nequals', () => {
    expect(blocks.nequals({OPERAND1: '1', OPERAND2: '2'})).toBe(true);
    expect(blocks.nequals({OPERAND1: '2', OPERAND2: '1'})).toBe(true);
    expect(blocks.nequals({OPERAND1: '1', OPERAND2: '1'})).toBe(false);
    expect(blocks.nequals({OPERAND1: 'あ', OPERAND2: 'ア'})).toBe(true);
});

test('ge', () => {
    expect(blocks.ge({OPERAND1: '1', OPERAND2: '2'})).toBe(false);
    expect(blocks.ge({OPERAND1: '2', OPERAND2: '1'})).toBe(true);
    expect(blocks.ge({OPERAND1: '1', OPERAND2: '1'})).toBe(true);
});

test('indexof', () => {
    expect(
        blocks.indexOf({POS: '1', STRING: 'kamiyama shiki kawaii!!', SUBSTRING: 'shiki'})
    ).toBe(10);
    expect(blocks.indexOf({POS: 1, STRING: 'dosukoi!!', SUBSTRING: 'Suk'})).toBe(-1);
    expect(blocks.indexOf({POS: 2, STRING: '测试测试测试测试', SUBSTRING: '测试'})).toBe(3);
    expect(blocks.indexOf({POS: 3, STRING: '😭😭😭😭😭😭😭😭', SUBSTRING: '🍡'})).toBe(-1);
});
