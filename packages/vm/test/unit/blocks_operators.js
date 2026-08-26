import {test} from '../fixtures/jest-tap-bridge.js';
import Operators from '../../src/blocks/scratch3_operators';

const blocks = new Operators(null);

test('getPrimitives', t => {
    t.type(blocks.getPrimitives(), 'object');
    t.end();
});

test('add', t => {
    t.equal(blocks.add({NUM1: '1', NUM2: '1'}), 2);
    t.equal(blocks.add({NUM1: 'foo', NUM2: 'bar'}), 0);
    t.end();
});

test('subtract', t => {
    t.equal(blocks.subtract({NUM1: '1', NUM2: '1'}), 0);
    t.equal(blocks.subtract({NUM1: 'foo', NUM2: 'bar'}), 0);
    t.end();
});

test('multiply', t => {
    t.equal(blocks.multiply({NUM1: '2', NUM2: '2'}), 4);
    t.equal(blocks.multiply({NUM1: 'foo', NUM2: 'bar'}), 0);
    t.end();
});

test('divide', t => {
    t.equal(blocks.divide({NUM1: '2', NUM2: '2'}), 1);
    t.ok(isNaN(blocks.divide({NUM1: 'foo', NUM2: 'bar'}))); // @todo
    t.end();
});

test('lt', t => {
    t.equal(blocks.lt({OPERAND1: '1', OPERAND2: '2'}), true);
    t.equal(blocks.lt({OPERAND1: '2', OPERAND2: '1'}), false);
    t.equal(blocks.lt({OPERAND1: '1', OPERAND2: '1'}), false);
    t.equal(blocks.lt({OPERAND1: '10', OPERAND2: '2'}), false);
    t.equal(blocks.lt({OPERAND1: 'a', OPERAND2: 'z'}), true);
    t.end();
});

test('equals', t => {
    t.equal(blocks.equals({OPERAND1: '1', OPERAND2: '2'}), false);
    t.equal(blocks.equals({OPERAND1: '2', OPERAND2: '1'}), false);
    t.equal(blocks.equals({OPERAND1: '1', OPERAND2: '1'}), true);
    t.equal(blocks.equals({OPERAND1: 'あ', OPERAND2: 'ア'}), false);
    t.end();
});

test('gt', t => {
    t.equal(blocks.gt({OPERAND1: '1', OPERAND2: '2'}), false);
    t.equal(blocks.gt({OPERAND1: '2', OPERAND2: '1'}), true);
    t.equal(blocks.gt({OPERAND1: '1', OPERAND2: '1'}), false);
    t.end();
});

test('and', t => {
    t.equal(blocks.and({OPERAND1: true, OPERAND2: true}), true);
    t.equal(blocks.and({OPERAND1: true, OPERAND2: false}), false);
    t.equal(blocks.and({OPERAND1: false, OPERAND2: false}), false);
    t.end();
});

test('or', t => {
    t.equal(blocks.or({OPERAND1: true, OPERAND2: true}), true);
    t.equal(blocks.or({OPERAND1: true, OPERAND2: false}), true);
    t.equal(blocks.or({OPERAND1: false, OPERAND2: false}), false);
    t.end();
});

test('not', t => {
    t.equal(blocks.not({OPERAND: true}), false);
    t.equal(blocks.not({OPERAND: false}), true);
    t.end();
});

test('random', t => {
    const min = 0;
    const max = 100;
    const result = blocks.random({FROM: min, TO: max});
    t.ok(result >= min);
    t.ok(result <= max);
    t.end();
});

test('random - equal', t => {
    const min = 1;
    const max = 1;
    t.equal(blocks.random({FROM: min, TO: max}), min);
    t.end();
});

test('random - decimal', t => {
    const min = 0.1;
    const max = 10;
    const result = blocks.random({FROM: min, TO: max});
    t.ok(result >= min);
    t.ok(result <= max);
    t.end();
});

test('random - int', t => {
    const min = 0;
    const max = 10;
    const result = blocks.random({FROM: min, TO: max});
    t.ok(result >= min);
    t.ok(result <= max);
    t.end();
});

test('random - reverse', t => {
    const min = 0;
    const max = 10;
    const result = blocks.random({FROM: max, TO: min});
    t.ok(result >= min);
    t.ok(result <= max);
    t.end();
});

test('join', t => {
    t.equal(blocks.join({STRING1: 'foo', STRING2: 'bar'}), 'foobar');
    t.equal(blocks.join({STRING1: '1', STRING2: '2'}), '12');
    t.end();
});

test('letterOf', t => {
    t.equal(blocks.letterOf({STRING: 'foo', LETTER: 0}), '');
    t.equal(blocks.letterOf({STRING: 'foo', LETTER: 1}), 'f');
    t.equal(blocks.letterOf({STRING: 'foo', LETTER: 2}), 'o');
    t.equal(blocks.letterOf({STRING: 'foo', LETTER: 3}), 'o');
    t.equal(blocks.letterOf({STRING: 'foo', LETTER: 4}), '');
    t.equal(blocks.letterOf({STRING: 'foo', LETTER: 'bar'}), '');
    t.end();
});

test('length', t => {
    t.equal(blocks.length({STRING: ''}), 0);
    t.equal(blocks.length({STRING: 'foo'}), 3);
    t.equal(blocks.length({STRING: '1'}), 1);
    t.equal(blocks.length({STRING: '100'}), 3);
    t.end();
});

test('contains', t => {
    t.equal(blocks.contains({STRING1: 'hello world', STRING2: 'hello'}), true);
    t.equal(blocks.contains({STRING1: 'foo', STRING2: 'bar'}), false);
    t.equal(blocks.contains({STRING1: 'HeLLo world', STRING2: 'hello'}), true);
    t.end();
});

test('mod', t => {
    t.equal(blocks.mod({NUM1: 1, NUM2: 1}), 0);
    t.equal(blocks.mod({NUM1: 3, NUM2: 6}), 3);
    t.equal(blocks.mod({NUM1: -3, NUM2: 6}), 3);
    t.end();
});

test('round', t => {
    t.equal(blocks.round({NUM: 1}), 1);
    t.equal(blocks.round({NUM: 1.1}), 1);
    t.equal(blocks.round({NUM: 1.5}), 2);
    t.end();
});

test('mathop', t => {
    t.equal(blocks.mathop({OPERATOR: 'abs', NUM: -1}), 1);
    t.equal(blocks.mathop({OPERATOR: 'floor', NUM: 1.5}), 1);
    t.equal(blocks.mathop({OPERATOR: 'ceiling', NUM: 0.1}), 1);
    t.equal(blocks.mathop({OPERATOR: 'sqrt', NUM: 1}), 1);
    t.equal(blocks.mathop({OPERATOR: 'sin', NUM: 1}), 0.0174524064);
    t.equal(blocks.mathop({OPERATOR: 'sin', NUM: 90}), 1);
    t.equal(blocks.mathop({OPERATOR: 'cos', NUM: 1}), 0.9998476952);
    t.equal(blocks.mathop({OPERATOR: 'cos', NUM: 180}), -1);
    t.equal(blocks.mathop({OPERATOR: 'tan', NUM: 1}), 0.0174550649);
    t.equal(blocks.mathop({OPERATOR: 'tan', NUM: 90}), Infinity);
    t.equal(blocks.mathop({OPERATOR: 'tan', NUM: 180}), 0);
    t.equal(blocks.mathop({OPERATOR: 'asin', NUM: 1}), 90);
    t.equal(blocks.mathop({OPERATOR: 'acos', NUM: 1}), 0);
    t.equal(blocks.mathop({OPERATOR: 'atan', NUM: 1}), 45);
    t.equal(blocks.mathop({OPERATOR: 'ln', NUM: 1}), 0);
    t.equal(blocks.mathop({OPERATOR: 'log', NUM: 1}), 0);
    t.equal(blocks.mathop({OPERATOR: 'e ^', NUM: 1}), 2.718281828459045);
    t.equal(blocks.mathop({OPERATOR: '10 ^', NUM: 1}), 10);
    t.equal(blocks.mathop({OPERATOR: 'undefined', NUM: 1}), 0);
    t.end();
});

test('power', t => {
    t.equal(blocks.power({NUM1: 2, NUM2: 0}), 1);
    t.equal(blocks.power({NUM1: 5, NUM2: -1}), 0.2);
    t.equal(blocks.power({NUM1: 4, NUM2: 0.5}), 2);
    t.end();
});

// @todo bit operation blocks

test('le', t => {
    t.equal(blocks.le({OPERAND1: '1', OPERAND2: '2'}), true);
    t.equal(blocks.le({OPERAND1: '2', OPERAND2: '1'}), false);
    t.equal(blocks.le({OPERAND1: '1', OPERAND2: '1'}), true);
    t.equal(blocks.le({OPERAND1: '10', OPERAND2: '2'}), false);
    t.equal(blocks.le({OPERAND1: 'a', OPERAND2: 'z'}), true);
    t.end();
});

test('nequals', t => {
    t.equal(blocks.nequals({OPERAND1: '1', OPERAND2: '2'}), true);
    t.equal(blocks.nequals({OPERAND1: '2', OPERAND2: '1'}), true);
    t.equal(blocks.nequals({OPERAND1: '1', OPERAND2: '1'}), false);
    t.equal(blocks.nequals({OPERAND1: 'あ', OPERAND2: 'ア'}), true);
    t.end();
});

test('ge', t => {
    t.equal(blocks.ge({OPERAND1: '1', OPERAND2: '2'}), false);
    t.equal(blocks.ge({OPERAND1: '2', OPERAND2: '1'}), true);
    t.equal(blocks.ge({OPERAND1: '1', OPERAND2: '1'}), true);
    t.end();
});

test('indexof', t => {
    t.equal(blocks.indexOf({POS: '1', STRING: 'kamiyama shiki kawaii!!', SUBSTRING: 'shiki'}), 10);
    t.equal(blocks.indexOf({POS: 1, STRING: 'dosukoi!!', SUBSTRING: 'Suk'}), -1);
    t.equal(blocks.indexOf({POS: 2, STRING: '测试测试测试测试', SUBSTRING: '测试'}), 3);
    t.equal(blocks.indexOf({POS: 3, STRING: '😭😭😭😭😭😭😭😭', SUBSTRING: '🍡'}), -1);
    t.end();
});
