const math = require('../../src/util/math-util');

test('degToRad', () => {
    expect(math.degToRad(0)).toBe(0);
    expect(math.degToRad(1)).toBe(0.017453292519943295);
    expect(math.degToRad(180)).toBe(Math.PI);
    expect(math.degToRad(360)).toBe(2 * Math.PI);
    expect(math.degToRad(720)).toBe(4 * Math.PI);
});

test('radToDeg', () => {
    expect(math.radToDeg(0)).toBe(0);
    expect(math.radToDeg(1)).toBe(57.29577951308232);
    expect(math.radToDeg(180)).toBe(10313.240312354817);
    expect(math.radToDeg(360)).toBe(20626.480624709635);
    expect(math.radToDeg(720)).toBe(41252.96124941927);
});

test('clamp', () => {
    expect(math.clamp(0, 0, 10)).toBe(0);
    expect(math.clamp(1, 0, 10)).toBe(1);
    expect(math.clamp(-10, 0, 10)).toBe(0);
    expect(math.clamp(100, 0, 10)).toBe(10);
});

test('wrapClamp', () => {
    expect(math.wrapClamp(0, 0, 10)).toBe(0);
    expect(math.wrapClamp(1, 0, 10)).toBe(1);
    expect(math.wrapClamp(-10, 0, 10)).toBe(1);
    expect(math.wrapClamp(100, 0, 10)).toBe(1);
});

test('tan', () => {
    expect(math.tan(90)).toBe(Infinity);
    expect(math.tan(180)).toBe(0);
    expect(math.tan(-90)).toBe(-Infinity);
    expect(math.tan(33)).toBe(0.6494075932);
});

test('reducedSortOrdering', () => {
    expect(math.reducedSortOrdering([5, 18, 6, 3])).toEqual([1, 3, 2, 0]);
    expect(math.reducedSortOrdering([5, 1, 56, 19])).toEqual([1, 0, 3, 2]);
});

test('inclusiveRandIntWithout', () => {
    const withRandomValue = function (randValue, ...args) {
        const oldMathRandom = Math.random;
        Object.assign(global.Math, {random: () => randValue});
        const result = math.inclusiveRandIntWithout(...args);
        Object.assign(global.Math, {random: oldMathRandom});
        return result;
    };

    expect(withRandomValue(3 / 6, 0, 6, 2)).toBe(4);
    expect(withRandomValue(2 / 6, 0, 6, 2)).toBe(3);
    expect(withRandomValue(1 / 6, 0, 6, 2)).toBe(1);
    expect(withRandomValue(1.9 / 6, 0, 6, 2)).toBe(1);

    expect(withRandomValue(3 / 4, 10, 14, 10)).toBe(14);
    expect(withRandomValue(0 / 4, 10, 14, 10)).toBe(11);
});
