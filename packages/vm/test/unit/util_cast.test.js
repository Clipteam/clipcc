const cast = require('../../src/util/cast');

test('toNumber', () => {
    // Numeric
    expect(cast.toNumber(0)).toBe(0);
    expect(cast.toNumber(1)).toBe(1);
    expect(cast.toNumber(3.14)).toBe(3.14);

    // String
    expect(cast.toNumber('0')).toBe(0);
    expect(cast.toNumber('1')).toBe(1);
    expect(cast.toNumber('3.14')).toBe(3.14);
    expect(cast.toNumber('0.1e10')).toBe(1000000000);
    expect(cast.toNumber('foobar')).toBe(0);

    // Boolean
    expect(cast.toNumber(true)).toBe(1);
    expect(cast.toNumber(false)).toBe(0);
    expect(cast.toNumber('true')).toBe(0);
    expect(cast.toNumber('false')).toBe(0);

    // Undefined & object
    expect(cast.toNumber(undefined)).toBe(0);
    expect(cast.toNumber({})).toBe(0);
    expect(cast.toNumber(NaN)).toBe(0);
});

test('toBoolean', () => {
    // Numeric
    expect(cast.toBoolean(0)).toBe(false);
    expect(cast.toBoolean(1)).toBe(true);
    expect(cast.toBoolean(3.14)).toBe(true);

    // String
    expect(cast.toBoolean('0')).toBe(false);
    expect(cast.toBoolean('1')).toBe(true);
    expect(cast.toBoolean('3.14')).toBe(true);
    expect(cast.toBoolean('0.1e10')).toBe(true);
    expect(cast.toBoolean('foobar')).toBe(true);

    // Boolean
    expect(cast.toBoolean(true)).toBe(true);
    expect(cast.toBoolean(false)).toBe(false);

    // Undefined & object
    expect(cast.toBoolean(undefined)).toBe(false);
    expect(cast.toBoolean({})).toBe(true);
});

test('toString', () => {
    // Numeric
    expect(cast.toString(0)).toBe('0');
    expect(cast.toString(1)).toBe('1');
    expect(cast.toString(3.14)).toBe('3.14');

    // String
    expect(cast.toString('0')).toBe('0');
    expect(cast.toString('1')).toBe('1');
    expect(cast.toString('3.14')).toBe('3.14');
    expect(cast.toString('0.1e10')).toBe('0.1e10');
    expect(cast.toString('foobar')).toBe('foobar');

    // Boolean
    expect(cast.toString(true)).toBe('true');
    expect(cast.toString(false)).toBe('false');

    // Undefined & object
    expect(cast.toString(undefined)).toBe('undefined');
    expect(cast.toString({})).toBe('[object Object]');
});

test('toRgbColorList', () => {
    // Hex (minimal, see "color" util tests)
    expect(cast.toRgbColorList('#000')).toEqual([0, 0, 0]);
    expect(cast.toRgbColorList('#000000')).toEqual([0, 0, 0]);
    expect(cast.toRgbColorList('#fff')).toEqual([255, 255, 255]);
    expect(cast.toRgbColorList('#ffffff')).toEqual([255, 255, 255]);

    // Decimal (minimal, see "color" util tests)
    expect(cast.toRgbColorList(0)).toEqual([0, 0, 0]);
    expect(cast.toRgbColorList(1)).toEqual([0, 0, 1]);
    expect(cast.toRgbColorList(16777215)).toEqual([255, 255, 255]);

    // Malformed
    expect(cast.toRgbColorList('ffffff')).toEqual([0, 0, 0]);
    expect(cast.toRgbColorList('foobar')).toEqual([0, 0, 0]);
    expect(cast.toRgbColorList('#nothex')).toEqual([0, 0, 0]);
});

test('toRgbColorObject', () => {
    // Hex (minimal, see "color" util tests)
    expect(cast.toRgbColorObject('#000')).toEqual({r: 0, g: 0, b: 0});
    expect(cast.toRgbColorObject('#000000')).toEqual({r: 0, g: 0, b: 0});
    expect(cast.toRgbColorObject('#fff')).toEqual({r: 255, g: 255, b: 255});
    expect(cast.toRgbColorObject('#ffffff')).toEqual({r: 255, g: 255, b: 255});

    // Decimal (minimal, see "color" util tests)
    expect(cast.toRgbColorObject(0)).toEqual({a: 255, r: 0, g: 0, b: 0});
    expect(cast.toRgbColorObject(1)).toEqual({a: 255, r: 0, g: 0, b: 1});
    expect(cast.toRgbColorObject(16777215)).toEqual({a: 255, r: 255, g: 255, b: 255});
    expect(cast.toRgbColorObject('0x80010203')).toEqual({a: 128, r: 1, g: 2, b: 3});

    // Malformed
    expect(cast.toRgbColorObject('ffffff')).toEqual({a: 255, r: 0, g: 0, b: 0});
    expect(cast.toRgbColorObject('foobar')).toEqual({a: 255, r: 0, g: 0, b: 0});
    expect(cast.toRgbColorObject('#nothex')).toEqual({a: 255, r: 0, g: 0, b: 0});
});

test('compare', () => {
    // Numeric
    expect(cast.compare(0, 0)).toBe(0);
    expect(cast.compare(1, 0)).toBe(1);
    expect(cast.compare(0, 1)).toBe(-1);
    expect(cast.compare(1, 1)).toBe(0);

    // String
    expect(cast.compare('0', '0')).toBe(0);
    expect(cast.compare('0.1e10', '1000000000')).toBe(0);
    expect(cast.compare('foobar', 'FOOBAR')).toBe(0);
    expect(cast.compare('dog', 'cat') > 0).toBeTruthy();

    // Boolean
    expect(cast.compare(true, true)).toBe(0);
    expect(cast.compare(true, false)).toBe(1);
    expect(cast.compare(false, true)).toBe(-1);
    expect(cast.compare(true, true)).toBe(0);

    // Undefined & object
    expect(cast.compare(undefined, undefined)).toBe(0);
    expect(cast.compare(undefined, 'undefined')).toBe(0);
    expect(cast.compare({}, {})).toBe(0);
    expect(cast.compare({}, '[object Object]')).toBe(0);
});

test('isInt', () => {
    // Numeric
    expect(cast.isInt(0)).toBe(true);
    expect(cast.isInt(1)).toBe(true);
    expect(cast.isInt(0.0)).toBe(true);
    expect(cast.isInt(3.14)).toBe(false);
    expect(cast.isInt(NaN)).toBe(true);

    // String
    expect(cast.isInt('0')).toBe(true);
    expect(cast.isInt('1')).toBe(true);
    expect(cast.isInt('0.0')).toBe(false);
    expect(cast.isInt('0.1e10')).toBe(false);
    expect(cast.isInt('3.14')).toBe(false);

    // Boolean
    expect(cast.isInt(true)).toBe(true);
    expect(cast.isInt(false)).toBe(true);

    // Undefined & object
    expect(cast.isInt(undefined)).toBe(false);
    expect(cast.isInt({})).toBe(false);
});

test('toListIndex', () => {
    const list = [0, 1, 2, 3, 4, 5];
    const empty = [];

    // Valid
    expect(cast.toListIndex(1, list.length, false)).toBe(1);
    expect(cast.toListIndex(6, list.length, false)).toBe(6);

    // Invalid
    expect(cast.toListIndex(-1, list.length, false)).toBe(cast.LIST_INVALID);
    expect(cast.toListIndex(0.1, list.length, false)).toBe(cast.LIST_INVALID);
    expect(cast.toListIndex(0, list.length, false)).toBe(cast.LIST_INVALID);
    expect(cast.toListIndex(7, list.length, false)).toBe(cast.LIST_INVALID);

    // "all"
    expect(cast.toListIndex('all', list.length, true)).toBe(cast.LIST_ALL);
    expect(cast.toListIndex('all', list.length, false)).toBe(cast.LIST_INVALID);

    // "last"
    expect(cast.toListIndex('last', list.length, false)).toBe(list.length);
    expect(cast.toListIndex('last', empty.length, false)).toBe(cast.LIST_INVALID);

    // "random"
    const random = cast.toListIndex('random', list.length, false);
    expect(random <= list.length).toBeTruthy();
    expect(random > 0).toBeTruthy();
    expect(cast.toListIndex('random', empty.length, false)).toBe(cast.LIST_INVALID);

    // "any" (alias for "random")
    const any = cast.toListIndex('any', list.length, false);
    expect(any <= list.length).toBeTruthy();
    expect(any > 0).toBeTruthy();
    expect(cast.toListIndex('any', empty.length, false)).toBe(cast.LIST_INVALID);
});
