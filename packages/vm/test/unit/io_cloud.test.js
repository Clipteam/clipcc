const Cloud = require('../../src/io/cloud');
const Target = require('../../src/engine/target');
const Variable = require('../../src/engine/variable');
const Runtime = require('../../src/engine/runtime');

test('spec', () => {
    const runtime = new Runtime();
    const cloud = new Cloud(runtime);

    expect(typeof cloud).toBe('object');
    expect(typeof cloud.postData).toBe('function');
    expect(typeof cloud.requestCreateVariable).toBe('function');
    expect(typeof cloud.requestUpdateVariable).toBe('function');
    expect(typeof cloud.requestRenameVariable).toBe('function');
    expect(typeof cloud.requestDeleteVariable).toBe('function');
    expect(typeof cloud.updateCloudVariable).toBe('function');
    expect(typeof cloud.setProvider).toBe('function');
    expect(typeof cloud.setStage).toBe('function');
    expect(typeof cloud.clear).toBe('function');
});

test('stage and provider are null initially', () => {
    const runtime = new Runtime();
    const cloud = new Cloud(runtime);

    expect(cloud.provider).toBe(null);
    expect(cloud.stage).toBe(null);
});

test('setProvider sets the provider', () => {
    const runtime = new Runtime();
    const cloud = new Cloud(runtime);

    const provider = {
        foo: 'a fake provider'
    };

    cloud.setProvider(provider);
    expect(cloud.provider).toBe(provider);
});

test('postData update message updates the variable', () => {
    const runtime = new Runtime();
    const stage = new Target(runtime);
    const fooVar = new Variable(
        'a fake var id',
        'foo',
        Variable.SCALAR_TYPE,
        true /* isCloud */
    );
    stage.variables[fooVar.id] = fooVar;

    expect(fooVar.value).toBe(0);

    const cloud = new Cloud(runtime);
    cloud.setStage(stage);
    cloud.postData({varUpdate: {
        name: 'foo',
        value: 3
    }});
    expect(fooVar.value).toBe(3);
});

test('requestUpdateVariable calls provider\'s updateVariable function', () => {
    let updateVariableCalled = false;
    let mockVarName = '';
    let mockVarValue = '';
    const mockUpdateVariable = (name, value) => {
        updateVariableCalled = true;
        mockVarName = name;
        mockVarValue = value;
        return;
    };

    const provider = {
        updateVariable: mockUpdateVariable
    };

    const runtime = new Runtime();
    const cloud = new Cloud(runtime);
    cloud.setProvider(provider);
    cloud.requestUpdateVariable('foo', 3);
    expect(updateVariableCalled).toBe(true);
    expect(mockVarName).toBe('foo');
    expect(mockVarValue).toBe(3);
});

test('requestCreateVariable calls provider\'s createVariable function', () => {
    let createVariableCalled = false;
    const mockVariable = new Variable('a var id', 'my var', Variable.SCALAR_TYPE, false);
    let mockVarName;
    let mockVarValue;
    const mockCreateVariable = (name, value) => {
        createVariableCalled = true;
        mockVarName = name;
        mockVarValue = value;
        return;
    };

    const provider = {
        createVariable: mockCreateVariable
    };

    const runtime = new Runtime();
    const cloud = new Cloud(runtime);
    cloud.setProvider(provider);
    cloud.requestCreateVariable(mockVariable);
    expect(createVariableCalled).toBe(true);
    expect(mockVarName).toBe('my var');
    expect(mockVarValue).toBe(0);
    // Calling requestCreateVariable does not set isCloud flag on variable
    expect(mockVariable.isCloud).toBe(false);
});

test('requestRenameVariable calls provider\'s renameVariable function', () => {
    let renameVariableCalled = false;
    let mockVarOldName;
    let mockVarNewName;
    const mockRenameVariable = (oldName, newName) => {
        renameVariableCalled = true;
        mockVarOldName = oldName;
        mockVarNewName = newName;
        return;
    };

    const provider = {
        renameVariable: mockRenameVariable
    };

    const runtime = new Runtime();
    const cloud = new Cloud(runtime);
    cloud.setProvider(provider);
    cloud.requestRenameVariable('my var', 'new var name');
    expect(renameVariableCalled).toBe(true);
    expect(mockVarOldName).toBe('my var');
    expect(mockVarNewName).toBe('new var name');
});

test('requestDeleteVariable calls provider\'s deleteVariable function', () => {
    let deleteVariableCalled = false;
    let mockVarName;
    const mockDeleteVariable = name => {
        deleteVariableCalled = true;
        mockVarName = name;
        return;
    };

    const provider = {
        deleteVariable: mockDeleteVariable
    };

    const runtime = new Runtime();
    const cloud = new Cloud(runtime);
    cloud.setProvider(provider);
    cloud.requestDeleteVariable('my var');
    expect(deleteVariableCalled).toBe(true);
    expect(mockVarName).toBe('my var');
});
