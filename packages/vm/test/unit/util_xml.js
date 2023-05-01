const xml = require('../../src/util/xml-escape');

test('escape', () => {
    const input = '<foo bar="he & llo \'"></foo>';
    const output = '&lt;foo bar=&quot;he &amp; llo &apos;&quot;&gt;&lt;/foo&gt;';
    expect(xml(input)).toBe(output);
});

test('xmlEscape (more)', () => {
    const empty = '';
    expect(xml(empty)).toBe(empty);

    const safe = 'hello';
    expect(xml(safe)).toBe(safe);

    const unsafe = '< > & \' "';
    expect(xml(unsafe)).toBe('&lt; &gt; &amp; &apos; &quot;');

    const single = '&';
    expect(xml(single)).toBe('&amp;');

    const mix = '<a>b& c\'def_-"';
    expect(xml(mix)).toBe('&lt;a&gt;b&amp; c&apos;def_-&quot;');

    const dupes = '<<&_"_"_&>>';
    expect(xml(dupes)).toBe('&lt;&lt;&amp;_&quot;_&quot;_&amp;&gt;&gt;');

    const emoji = '(>^_^)>';
    expect(xml(emoji)).toBe('(&gt;^_^)&gt;');
});

test('xmlEscape should handle non strings', () => {
    const array = ['hello', 'world'];
    expect(xml(array)).toBe(String(array));

    const arrayWithSpecialChar = ['hello', '<world>'];
    expect(xml(arrayWithSpecialChar)).toBe('hello,&lt;world&gt;');

    const arrayWithNumbers = [1, 2, 3];
    expect(xml(arrayWithNumbers)).toBe('1,2,3');

    // Objects shouldn't get provided to replaceUnsafeChars, but in the event
    // they do, it should just return the object (and log an error)
    const object = {hello: 'world'};
    expect(xml(object)).toBe(object);
});
