const StringUtil = require('../../src/util/string-util');

test('splitFirst', () => {
    expect(StringUtil.splitFirst('asdf.1234', '.')).toEqual(['asdf', '1234']);
    expect(StringUtil.splitFirst('asdf.', '.')).toEqual(['asdf', '']);
    expect(StringUtil.splitFirst('.1234', '.')).toEqual(['', '1234']);
    expect(StringUtil.splitFirst('foo', '.')).toEqual(['foo', null]);
});

test('withoutTrailingDigits', () => {
    expect(StringUtil.withoutTrailingDigits('boeing747')).toBe('boeing');
    expect(StringUtil.withoutTrailingDigits('boeing747 ')).toBe('boeing747 ');
    expect(StringUtil.withoutTrailingDigits('boeing𝟨')).toBe('boeing𝟨');
    expect(StringUtil.withoutTrailingDigits('boeing 747')).toBe('boeing ');
    expect(StringUtil.withoutTrailingDigits('747')).toBe('');
});

test('unusedName', () => {
    expect(StringUtil.unusedName(
        'name',
        ['not the same name']
    )).toBe('name');
    expect(StringUtil.unusedName(
        'name',
        ['name']
    )).toBe('name2');
    expect(StringUtil.unusedName(
        'name',
        ['name30']
    )).toBe('name');
    expect(StringUtil.unusedName(
        'name',
        ['name', 'name2']
    )).toBe('name3');
    expect(StringUtil.unusedName(
        'name',
        ['name', 'name3']
    )).toBe('name2');
    expect(StringUtil.unusedName(
        'boeing747',
        ['boeing747']
    )).toBe(// Yup, this matches scratch-flash...
    'boeing2');
});

test('stringify', () => {
    const obj = {
        a: Infinity,
        b: NaN,
        c: -Infinity,
        d: 23,
        e: 'str',
        f: {
            nested: Infinity
        }
    };
    const parsed = JSON.parse(StringUtil.stringify(obj));
    expect(parsed.a).toBe(0);
    expect(parsed.b).toBe(0);
    expect(parsed.c).toBe(0);
    expect(parsed.d).toBe(23);
    expect(parsed.e).toBe('str');
    expect(parsed.f.nested).toBe(0);
});

test('replaceUnsafeChars', () => {
    const empty = '';
    expect(StringUtil.replaceUnsafeChars(empty)).toBe(empty);

    const safe = 'hello';
    expect(StringUtil.replaceUnsafeChars(safe)).toBe(safe);

    const unsafe = '< > & \' "';
    expect(StringUtil.replaceUnsafeChars(unsafe)).toBe('lt gt amp apos quot');

    const single = '&';
    expect(StringUtil.replaceUnsafeChars(single)).toBe('amp');

    const mix = '<a>b& c\'def_-"';
    expect(StringUtil.replaceUnsafeChars(mix)).toBe('ltagtbamp caposdef_-quot');

    const dupes = '<<&_"_"_&>>';
    expect(StringUtil.replaceUnsafeChars(dupes)).toBe('ltltamp_quot_quot_ampgtgt');

    const emoji = '(>^_^)>';
    expect(StringUtil.replaceUnsafeChars(emoji)).toBe('(gt^_^)gt');
});

test('replaceUnsafeChars should handle non strings', () => {
    const array = ['hello', 'world'];
    expect(StringUtil.replaceUnsafeChars(array)).toBe(String(array));

    const arrayWithSpecialChar = ['hello', '<world>'];
    expect(StringUtil.replaceUnsafeChars(arrayWithSpecialChar)).toBe('hello,ltworldgt');

    const arrayWithNumbers = [1, 2, 3];
    expect(StringUtil.replaceUnsafeChars(arrayWithNumbers)).toBe('1,2,3');

    // Objects shouldn't get provided to replaceUnsafeChars, but in the event
    // they do, it should just return the object (and log an error)
    const object = {hello: 'world'};
    expect(StringUtil.replaceUnsafeChars(object)).toBe(object);
});
