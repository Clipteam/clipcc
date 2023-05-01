const Variable = require('../../src/engine/variable');
const htmlparser = require('htmlparser2');

test('spec', () => {
    expect(typeof Variable.SCALAR_TYPE).toBe(typeof Variable.LIST_TYPE);
    expect(typeof Variable.SCALAR_TYPE).toBe(typeof Variable.BROADCAST_MESSAGE_TYPE);

    const varId = 'varId';
    const varName = 'varName';
    const varIsCloud = false;
    let v = new Variable(
        varId,
        varName,
        Variable.SCALAR_TYPE,
        varIsCloud
    );

    expect(typeof Variable).toBe('function');
    expect(typeof v).toBe('object');
    expect(v instanceof Variable).toBeTruthy();

    expect(v.id).toBe(varId);
    expect(v.name).toBe(varName);
    expect(v.type).toBe(Variable.SCALAR_TYPE);
    expect(typeof v.value).toBe('number');
    expect(v.isCloud).toBe(varIsCloud);

    expect(typeof v.toXML).toBe('function');

    v = new Variable(
        varId,
        varName,
        Variable.LIST_TYPE,
        varIsCloud
    );
    expect(Array.isArray(v.value)).toBeTruthy();

    v = new Variable(
        varId,
        varName,
        Variable.BROADCAST_MESSAGE_TYPE,
        varIsCloud
    );
    expect(v.value).toBe('varName');
});

test('toXML', () => {
    const varId = 'varId';
    const varName = 'varName';
    const varIsCloud = false;
    const varIsLocal = false;
    const v = new Variable(
        varId,
        varName,
        Variable.SCALAR_TYPE,
        varIsCloud
    );

    const parser = new htmlparser.Parser({
        onopentag: function (name, attribs){
            if (name === 'variable'){
                expect(attribs.type).toBe(Variable.SCALAR_TYPE);
                expect(attribs.id).toBe(varId);
                expect(attribs.iscloud).toBe(varIsCloud.toString());
                expect(attribs.islocal).toBe(varIsLocal.toString());
            }
        },
        ontext: function (text){
            expect(text).toBe(varName);
        }
    }, {decodeEntities: false});
    parser.write(v.toXML(false));
    parser.end();
});

test('escape variable name for XML', () => {
    const varId = 'varId';
    const varName = '<>&\'"';
    const varIsCloud = false;
    const varIsLocal = false;
    const v = new Variable(
        varId,
        varName,
        Variable.SCALAR_TYPE,
        varIsCloud
    );

    const parser = new htmlparser.Parser({
        onopentag: function (name, attribs){
            if (name === 'variable'){
                expect(attribs.type).toBe(Variable.SCALAR_TYPE);
                expect(attribs.id).toBe(varId);
                expect(attribs.iscloud).toBe(varIsCloud.toString());
                expect(attribs.islocal).toBe(varIsLocal.toString());
            }
        },
        ontext: function (text){
            expect(text).toBe('&lt;&gt;&amp;&apos;&quot;');
        }
    }, {decodeEntities: false});
    parser.write(v.toXML(false));
    parser.end();
});
