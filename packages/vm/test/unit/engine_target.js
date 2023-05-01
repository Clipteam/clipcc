const Target = require('../../src/engine/target');
const Variable = require('../../src/engine/variable');
const adapter = require('../../src/engine/adapter');
const Runtime = require('../../src/engine/runtime');
const events = require('../fixtures/events.json');

test('spec', () => {
    const target = new Target(new Runtime());

    expect(typeof Target).toBe('function');
    expect(typeof target).toBe('object');
    expect(target instanceof Target).toBeTruthy();

    expect(typeof target.id).toBe('string');
    expect(typeof target.blocks).toBe('object');
    expect(typeof target.variables).toBe('object');
    expect(typeof target.comments).toBe('object');
    expect(typeof target._customState).toBe('object');

    expect(typeof target.createVariable).toBe('function');
    expect(typeof target.renameVariable).toBe('function');
});

// Create Variable tests.
test('createVariable', () => {
    const target = new Target(new Runtime());
    target.createVariable('foo', 'bar', Variable.SCALAR_TYPE);

    const variables = target.variables;
    expect(Object.keys(variables).length).toBe(1);
    const variable = variables[Object.keys(variables)[0]];
    expect(variable.id).toBe('foo');
    expect(variable.name).toBe('bar');
    expect(variable.type).toBe(Variable.SCALAR_TYPE);
    expect(variable.value).toBe(0);
    expect(variable.isCloud).toBe(false);
});

// Create Same Variable twice.
test('createVariable2', () => {
    const target = new Target(new Runtime());
    target.createVariable('foo', 'bar', Variable.SCALAR_TYPE);
    target.createVariable('foo', 'bar', Variable.SCALAR_TYPE);

    const variables = target.variables;
    expect(Object.keys(variables).length).toBe(1);
});

// Create a list
test('createListVariable creates a list', () => {
    const target = new Target(new Runtime());
    target.createVariable('foo', 'bar', Variable.LIST_TYPE);

    const variables = target.variables;
    expect(Object.keys(variables).length).toBe(1);
    const variable = variables[Object.keys(variables)[0]];
    expect(variable.id).toBe('foo');
    expect(variable.name).toBe('bar');
    expect(variable.type).toBe(Variable.LIST_TYPE);
    expect(variable.value instanceof Array).toBeTruthy();
    expect(variable.value.length).toBe(0);
    expect(variable.isCloud).toBe(false);
});

test('createVariable calls cloud io device\'s requestCreateVariable', () => {
    const runtime = new Runtime();
    // Mock the requestCreateVariable function
    let requestCreateCloudWasCalled = false;
    runtime.ioDevices.cloud.requestCreateVariable = () => {
        requestCreateCloudWasCalled = true;
    };

    const target = new Target(runtime);
    target.isStage = true;
    target.createVariable('foo', 'bar', Variable.SCALAR_TYPE, true /* isCloud */);

    const variables = target.variables;
    expect(Object.keys(variables).length).toBe(1);
    const variable = variables[Object.keys(variables)[0]];
    expect(variable.id).toBe('foo');
    expect(variable.name).toBe('bar');
    expect(variable.type).toBe(Variable.SCALAR_TYPE);
    expect(variable.value).toBe(0);
    expect(variable.isCloud).toBe(true);
    expect(requestCreateCloudWasCalled).toBe(true);
});

test('createVariable does not call cloud io device\'s requestCreateVariable if target is not stage', () => {
    const runtime = new Runtime();
    // Mock the requestCreateVariable function
    let requestCreateCloudWasCalled = false;
    runtime.ioDevices.cloud.requestCreateVariable = () => {
        requestCreateCloudWasCalled = true;
    };

    const target = new Target(runtime);
    target.isStage = false;
    target.createVariable('foo', 'bar', Variable.SCALAR_TYPE, true /* isCloud */);

    const variables = target.variables;
    expect(Object.keys(variables).length).toBe(1);
    const variable = variables[Object.keys(variables)[0]];
    expect(variable.id).toBe('foo');
    expect(variable.name).toBe('bar');
    expect(variable.type).toBe(Variable.SCALAR_TYPE);
    expect(variable.value).toBe(0);
    // isCloud flag doesn't get set if the target is not the stage
    expect(variable.isCloud).toBe(false);
    expect(requestCreateCloudWasCalled).toBe(false);
});

test('createVariable throws when given invalid type', () => {
    const target = new Target(new Runtime());
    expect((() => target.createVariable('foo', 'bar', 'baz'))).toThrowError(new Error('Invalid variable type: baz'));
});

// Rename Variable tests.
test('renameVariable', () => {
    const target = new Target(new Runtime());
    target.createVariable('foo', 'bar', Variable.SCALAR_TYPE);
    target.renameVariable('foo', 'bar2');

    const variables = target.variables;
    expect(Object.keys(variables).length).toBe(1);
    const variable = variables[Object.keys(variables)[0]];
    expect(variable.id).toBe('foo');
    expect(variable.name).toBe('bar2');
    expect(variable.value).toBe(0);
    expect(variable.isCloud).toBe(false);
});

// Rename Variable that doesn't exist.
test('renameVariable2', () => {
    const target = new Target(new Runtime());
    target.renameVariable('foo', 'bar2');

    const variables = target.variables;
    expect(Object.keys(variables).length).toBe(0);
});

// Rename Variable that with id that exists as another variable's name.
// Expect no change.
test('renameVariable3', () => {
    const target = new Target(new Runtime());
    target.createVariable('foo1', 'foo', Variable.SCALAR_TYPE);
    target.renameVariable('foo', 'bar2');

    const variables = target.variables;
    expect(Object.keys(variables).length).toBe(1);
    const variable = variables[Object.keys(variables)[0]];
    expect(variable.id).toBe('foo1');
    expect(variable.name).toBe('foo');
});

test('renameVariable calls cloud io device\'s requestRenameVariable function', () => {
    const runtime = new Runtime();

    let requestRenameVariableWasCalled = false;
    runtime.ioDevices.cloud.requestRenameVariable = () => {
        requestRenameVariableWasCalled = true;
    };

    const target = new Target(runtime);
    target.isStage = true;
    const mockCloudVar = new Variable('foo', 'bar', Variable.SCALAR_TYPE, true);
    target.variables[mockCloudVar.id] = mockCloudVar;
    runtime.addTarget(target);

    target.renameVariable('foo', 'bar2');

    const variables = target.variables;
    expect(Object.keys(variables).length).toBe(1);
    const variable = variables[Object.keys(variables)[0]];
    expect(variable.id).toBe('foo');
    expect(variable.name).toBe('bar2');
    expect(variable.value).toBe(0);
    expect(variable.isCloud).toBe(true);
    expect(requestRenameVariableWasCalled).toBe(true);
});

test('renameVariable does not call cloud io device\'s requestRenameVariable function if target is not stage', () => {
    const runtime = new Runtime();

    let requestRenameVariableWasCalled = false;
    runtime.ioDevices.cloud.requestRenameVariable = () => {
        requestRenameVariableWasCalled = true;
    };

    const target = new Target(runtime);
    const mockCloudVar = new Variable('foo', 'bar', Variable.SCALAR_TYPE, true);
    target.variables[mockCloudVar.id] = mockCloudVar;
    runtime.addTarget(target);

    target.renameVariable('foo', 'bar2');

    const variables = target.variables;
    expect(Object.keys(variables).length).toBe(1);
    const variable = variables[Object.keys(variables)[0]];
    expect(variable.id).toBe('foo');
    expect(variable.name).toBe('bar2');
    expect(variable.value).toBe(0);
    expect(variable.isCloud).toBe(true);
    expect(requestRenameVariableWasCalled).toBe(false);
});

// Delete Variable tests.
test('deleteVariable', () => {
    const target = new Target(new Runtime());
    target.createVariable('foo', 'bar', Variable.SCALAR_TYPE);
    target.deleteVariable('foo');

    const variables = target.variables;
    expect(Object.keys(variables).length).toBe(0);
});

// Delete Variable that doesn't exist.
test('deleteVariable2', () => {
    const target = new Target(new Runtime());
    target.deleteVariable('foo');

    const variables = target.variables;
    expect(Object.keys(variables).length).toBe(0);
});

test('deleteVariable calls cloud io device\'s requestRenameVariable function', () => {
    const runtime = new Runtime();

    let requestDeleteVariableWasCalled = false;
    runtime.ioDevices.cloud.requestDeleteVariable = () => {
        requestDeleteVariableWasCalled = true;
    };

    const target = new Target(runtime);
    target.isStage = true;
    const mockCloudVar = new Variable('foo', 'bar', Variable.SCALAR_TYPE, true);
    target.variables[mockCloudVar.id] = mockCloudVar;
    runtime.addTarget(target);

    target.deleteVariable('foo');

    const variables = target.variables;
    expect(Object.keys(variables).length).toBe(0);
    expect(requestDeleteVariableWasCalled).toBe(true);
});

test('deleteVariable calls cloud io device\'s requestRenameVariable function', () => {
    const runtime = new Runtime();

    let requestDeleteVariableWasCalled = false;
    runtime.ioDevices.cloud.requestDeleteVariable = () => {
        requestDeleteVariableWasCalled = true;
    };

    const target = new Target(runtime);
    const mockCloudVar = new Variable('foo', 'bar', Variable.SCALAR_TYPE, true);
    target.variables[mockCloudVar.id] = mockCloudVar;
    runtime.addTarget(target);

    target.deleteVariable('foo');

    const variables = target.variables;
    expect(Object.keys(variables).length).toBe(0);
    expect(requestDeleteVariableWasCalled).toBe(false);
});

test('duplicateVariable creates a new variable with a new ID by default', () => {
    const target = new Target(new Runtime());
    target.createVariable('a var ID', 'foo', Variable.SCALAR_TYPE);
    expect(Object.keys(target.variables).length).toBe(1);
    const originalVariable = target.variables['a var ID'];
    originalVariable.value = 10;
    const newVariable = target.duplicateVariable('a var ID');
    // Duplicating a variable should not add the variable to the current target
    expect(Object.keys(target.variables).length).toBe(1);
    // Duplicate variable should have a different ID from the original unless specified to keep the original ID.
    expect(newVariable.id).not.toBe('a var ID');
    expect(typeof target.variables[newVariable.id]).toBe('undefined');

    // Duplicate variable should start out with the same value as the original variable
    expect(newVariable.value).toBe(originalVariable.value);

    // Modifying one variable should not modify the other
    newVariable.value = 15;
    expect(newVariable.value).not.toBe(originalVariable.value);
    expect(originalVariable.value).toBe(10);
});

test('duplicateVariable creates new array reference for list variable.value', () => {
    const target = new Target(new Runtime());
    const arr = [1, 2, 3];
    target.createVariable('a var ID', 'arr', Variable.LIST_TYPE);
    const originalVariable = target.variables['a var ID'];
    originalVariable.value = arr;
    const newVariable = target.duplicateVariable('a var ID');
    // Values are deeply equal but not the same object
    expect(originalVariable.value).toEqual(newVariable.value);
    expect(originalVariable.value).not.toBe(newVariable.value);
});

test('duplicateVariable creates a new variable with a original ID if specified', () => {
    const target = new Target(new Runtime());
    target.createVariable('a var ID', 'foo', Variable.SCALAR_TYPE);
    expect(Object.keys(target.variables).length).toBe(1);
    const originalVariable = target.variables['a var ID'];
    originalVariable.value = 10;
    const newVariable = target.duplicateVariable('a var ID', true);
    // Duplicating a variable should not add the variable to the current target
    expect(Object.keys(target.variables).length).toBe(1);
    // Duplicate variable should have the same ID as the original when specified
    expect(newVariable.id).toBe('a var ID');

    // Duplicate variable should start out with the same value as the original variable
    expect(newVariable.value).toBe(originalVariable.value);

    // Modifying one variable should not modify the other
    newVariable.value = 15;
    expect(newVariable.value).not.toBe(originalVariable.value);
    expect(originalVariable.value).toBe(10);
    // The target should still have the original variable with the original value
    expect(target.variables['a var ID'].value).toBe(10);
});

test('duplicateVariable returns null if variable with specified ID does not exist', () => {
    const target = new Target(new Runtime());

    const variable = target.duplicateVariable('a var ID');
    expect(variable).toBe(null);
    expect(Object.keys(target.variables).length).toBe(0);

    target.createVariable('var id', 'foo', Variable.SCALAR_TYPE);
    expect(Object.keys(target.variables).length).toBe(1);

    const anotherVariable = target.duplicateVariable('another var ID');
    expect(anotherVariable).toBe(null);
    expect(Object.keys(target.variables).length).toBe(1);
    expect(typeof target.variables['another var ID']).toBe('undefined');
    expect(typeof target.variables['var id']).toBe('object');
    expect(target.variables['var id']).not.toBe(null);
});

test('duplicateVariables duplicates all variables', () => {
    const target = new Target(new Runtime());
    target.createVariable('var ID 1', 'var1', Variable.SCALAR_TYPE);
    target.createVariable('var ID 2', 'var2', Variable.SCALAR_TYPE);

    expect(Object.keys(target.variables).length).toBe(2);

    const var1 = target.variables['var ID 1'];
    const var2 = target.variables['var ID 2'];

    var1.value = 3;
    var2.value = 'foo';

    const duplicateVariables = target.duplicateVariables();

    // Duplicating a target's variables should not change the target's own variables.
    expect(Object.keys(target.variables).length).toBe(2);
    expect(Object.keys(duplicateVariables).length).toBe(2);

    // Should be able to find original var IDs in both this target's variables and
    // the duplicate variables since a blocks container was not specified.
    expect(target.variables.hasOwnProperty('var ID 1')).toBe(true);
    expect(target.variables.hasOwnProperty('var ID 2')).toBe(true);
    expect(duplicateVariables.hasOwnProperty('var ID 1')).toBe(true);
    expect(duplicateVariables.hasOwnProperty('var ID 1')).toBe(true);

    // Values of the duplicate varaiables should match the value of the original values at the time of duplication
    expect(target.variables['var ID 1'].value).toBe(duplicateVariables['var ID 1'].value);
    expect(duplicateVariables['var ID 1'].value).toBe(3);
    expect(target.variables['var ID 2'].value).toBe(duplicateVariables['var ID 2'].value);
    expect(duplicateVariables['var ID 2'].value).toBe('foo');

    // The two sets of variables should still be distinct, modifying the target's variables
    // should not affect the duplicated variables, and vice-versa

    var1.value = 10;
    expect(target.variables['var ID 1'].value).toBe(10);
    expect(duplicateVariables['var ID 1'].value).toBe(3); // should remain unchanged from initial value

    duplicateVariables['var ID 2'].value = 'bar';
    expect(target.variables['var ID 2'].value).toBe('foo');

    // Deleting a variable on the target should not change the duplicated variables
    target.deleteVariable('var ID 1');
    expect(Object.keys(target.variables).length).toBe(1);
    expect(Object.keys(duplicateVariables).length).toBe(2);
    expect(typeof duplicateVariables['var ID 1']).toBe('object');
    expect(duplicateVariables['var ID 1']).not.toBe(null);
});

test('duplicateVariables re-IDs variables when a block container is provided', () => {
    const target = new Target(new Runtime());

    target.createVariable('mock var id', 'a mock variable', Variable.SCALAR_TYPE);
    target.createVariable('another var id', 'var2', Variable.SCALAR_TYPE);

    // Create a block on the target which references the variable with id 'mock var id'
    target.blocks.createBlock(adapter(events.mockVariableBlock)[0]);

    expect(typeof target.blocks.getBlock('a block')).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.value).toBe('a mock variable');

    // Deep clone this target's blocks to pass in to 'duplicateVariables'
    const copiedBlocks = target.blocks.duplicate();

    // The copied block should still have the same ID, and its VARIABLE field should still refer to
    // the original variable id
    expect(typeof copiedBlocks.getBlock('a block')).toBe('object');
    expect(typeof copiedBlocks.getBlock('a block').fields.VARIABLE).toBe('object');
    expect(copiedBlocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');
    expect(copiedBlocks.getBlock('a block').fields.VARIABLE.value).toBe('a mock variable');

    const duplicateVariables = target.duplicateVariables(copiedBlocks);

    // Duplicate variables should have new IDs
    expect(Object.keys(duplicateVariables).length).toBe(2);
    expect(typeof duplicateVariables['mock var id']).toBe('undefined');
    expect(typeof duplicateVariables['another var id']).toBe('undefined');

    // Duplicate variables still have the same names..
    const dupes = Object.values(duplicateVariables);
    const dupeVarNames = dupes.map(v => v.name);

    expect(dupeVarNames.indexOf('a mock variable')).not.toBe(-1);
    expect(dupeVarNames.indexOf('var2')).not.toBe(-1);

    // Duplicating variables should not change blocks on current target
    expect(typeof target.blocks.getBlock('a block')).toBe('object');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.value).toBe('a mock variable');

    // The copied blocks passed into duplicateVariables should now reference the new
    // variable ID
    const mockVariableDupe = dupes[dupeVarNames.indexOf('a mock variable')];
    const mockVarDupeID = mockVariableDupe.id;

    expect(typeof copiedBlocks.getBlock('a block')).toBe('object');
    expect(copiedBlocks.getBlock('a block').fields.VARIABLE.id).toBe(mockVarDupeID);
    expect(copiedBlocks.getBlock('a block').fields.VARIABLE.value).toBe('a mock variable');
});

test('lookupOrCreateList creates a list if var with given id or var with given name does not exist', () => {
    const target = new Target(new Runtime());
    const variables = target.variables;

    expect(Object.keys(variables).length).toBe(0);
    const listVar = target.lookupOrCreateList('foo', 'bar');
    expect(Object.keys(variables).length).toBe(1);
    expect(listVar.id).toBe('foo');
    expect(listVar.name).toBe('bar');
});

test('lookupOrCreateList returns list if one with given id exists', () => {
    const target = new Target(new Runtime());
    const variables = target.variables;

    expect(Object.keys(variables).length).toBe(0);
    target.createVariable('foo', 'bar', Variable.LIST_TYPE);
    expect(Object.keys(variables).length).toBe(1);

    const listVar = target.lookupOrCreateList('foo', 'bar');
    expect(Object.keys(variables).length).toBe(1);
    expect(listVar.id).toBe('foo');
    expect(listVar.name).toBe('bar');
});

test('lookupOrCreateList succeeds in finding list if id is incorrect but name matches', () => {
    const target = new Target(new Runtime());
    const variables = target.variables;

    expect(Object.keys(variables).length).toBe(0);
    target.createVariable('foo', 'bar', Variable.LIST_TYPE);
    expect(Object.keys(variables).length).toBe(1);

    const listVar = target.lookupOrCreateList('not foo', 'bar');
    expect(Object.keys(variables).length).toBe(1);
    expect(listVar.id).toBe('foo');
    expect(listVar.name).toBe('bar');
});

test('lookupBroadcastMsg returns the var with given id if exists', () => {
    const target = new Target(new Runtime());
    const variables = target.variables;

    expect(Object.keys(variables).length).toBe(0);
    target.createVariable('foo', 'bar', Variable.BROADCAST_MESSAGE_TYPE);
    expect(Object.keys(variables).length).toBe(1);

    const broadcastMsg = target.lookupBroadcastMsg('foo', 'bar');
    expect(Object.keys(variables).length).toBe(1);
    expect(broadcastMsg.id).toBe('foo');
    expect(broadcastMsg.name).toBe('bar');
});

test('createComment adds a comment to the target', () => {
    const target = new Target(new Runtime());
    const comments = target.comments;

    expect(Object.keys(comments).length).toBe(0);
    target.createComment('a comment', null, 'some comment text',
        10, 20, 200, 300, true);
    expect(Object.keys(comments).length).toBe(1);

    const comment = comments['a comment'];
    expect(comment).not.toBe(null);
    expect(comment.blockId).toBe(null);
    expect(comment.text).toBe('some comment text');
    expect(comment.x).toBe(10);
    expect(comment.y).toBe(20);
    expect(comment.width).toBe(200);
    expect(comment.height).toBe(300);
    expect(comment.minimized).toBe(true);
});

test('creating comment with id that already exists does not change existing comment', () => {
    const target = new Target(new Runtime());
    const comments = target.comments;

    expect(Object.keys(comments).length).toBe(0);
    target.createComment('a comment', null, 'some comment text',
        10, 20, 200, 300, true);
    expect(Object.keys(comments).length).toBe(1);

    target.createComment('a comment', null,
        'some new comment text', 40, 50, 300, 400, false);

    const comment = comments['a comment'];
    expect(comment).not.toBe(null);
    // All of the comment properties should remain unchanged from the first
    // time createComment was called
    expect(comment.blockId).toBe(null);
    expect(comment.text).toBe('some comment text');
    expect(comment.x).toBe(10);
    expect(comment.y).toBe(20);
    expect(comment.width).toBe(200);
    expect(comment.height).toBe(300);
    expect(comment.minimized).toBe(true);
});

test('creating a comment with a blockId also updates the comment property on the block', () => {
    const target = new Target(new Runtime());
    const comments = target.comments;
    // Create a mock block on the target
    target.blocks = {
        'a mock block': {
            id: 'a mock block'
        }
    };

    // Mock the getBlock function that's used in commentCreate
    target.blocks.getBlock = id => target.blocks[id];

    expect(Object.keys(comments).length).toBe(0);
    target.createComment('a comment', 'a mock block', 'some comment text',
        10, 20, 200, 300, true);
    expect(Object.keys(comments).length).toBe(1);

    const comment = comments['a comment'];
    expect(comment.blockId).toBe('a mock block');
    expect(target.blocks.getBlock('a mock block').comment).toBe('a comment');
});

test('fixUpVariableReferences fixes sprite global var conflicting with project global var', () => {
    const runtime = new Runtime();

    const stage = new Target(runtime);
    stage.isStage = true;

    const target = new Target(runtime);
    target.isStage = false;

    runtime.targets = [stage, target];

    // Create a global variable
    stage.createVariable('pre-existing global var id', 'a mock variable', Variable.SCALAR_TYPE);

    target.blocks.createBlock(adapter(events.mockVariableBlock)[0]);

    expect(Object.keys(target.variables).length).toBe(0);
    expect(Object.keys(stage.variables).length).toBe(1);
    expect(typeof target.blocks.getBlock('a block')).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');

    target.fixUpVariableReferences();

    expect(Object.keys(target.variables).length).toBe(0);
    expect(Object.keys(stage.variables).length).toBe(1);
    expect(typeof target.blocks.getBlock('a block')).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('pre-existing global var id');
});

test('fixUpVariableReferences fixes sprite local var conflicting with project global var', () => {
    const runtime = new Runtime();

    const stage = new Target(runtime);
    stage.isStage = true;

    const target = new Target(runtime);
    target.isStage = false;
    target.getName = () => 'Target';

    runtime.targets = [stage, target];

    // Create a global variable
    stage.createVariable('pre-existing global var id', 'a mock variable', Variable.SCALAR_TYPE);
    target.createVariable('mock var id', 'a mock variable', Variable.SCALAR_TYPE);

    target.blocks.createBlock(adapter(events.mockVariableBlock)[0]);

    expect(Object.keys(target.variables).length).toBe(1);
    expect(Object.keys(stage.variables).length).toBe(1);
    expect(typeof target.blocks.getBlock('a block')).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');
    expect(target.variables['mock var id'].name).toBe('a mock variable');

    target.fixUpVariableReferences();

    expect(Object.keys(target.variables).length).toBe(1);
    expect(Object.keys(stage.variables).length).toBe(1);
    expect(typeof target.blocks.getBlock('a block')).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');
    expect(target.variables['mock var id'].name).toBe('Target: a mock variable');
});

test('fixUpVariableReferences fixes conflicting sprite local var without blocks referencing var', () => {
    const runtime = new Runtime();

    const stage = new Target(runtime);
    stage.isStage = true;

    const target = new Target(runtime);
    target.isStage = false;
    target.getName = () => 'Target';

    runtime.targets = [stage, target];

    // Create a global variable
    stage.createVariable('pre-existing global var id', 'a mock variable', Variable.SCALAR_TYPE);
    target.createVariable('mock var id', 'a mock variable', Variable.SCALAR_TYPE);


    expect(Object.keys(target.variables).length).toBe(1);
    expect(Object.keys(stage.variables).length).toBe(1);
    expect(target.variables['mock var id'].name).toBe('a mock variable');

    target.fixUpVariableReferences();

    expect(Object.keys(target.variables).length).toBe(1);
    expect(Object.keys(stage.variables).length).toBe(1);
    expect(target.variables['mock var id'].name).toBe('Target: a mock variable');
});

test('fixUpVariableReferences fixes sprite global var conflicting with other sprite\'s local var', () => {
    const runtime = new Runtime();

    const stage = new Target(runtime);
    stage.isStage = true;

    const target = new Target(runtime);
    target.isStage = false;

    const existingTarget = new Target(runtime);
    existingTarget.isStage = false;

    runtime.targets = [stage, target, existingTarget];

    // Create a local variable on the pre-existing target
    existingTarget.createVariable('pre-existing local var id', 'a mock variable', Variable.SCALAR_TYPE);

    target.blocks.createBlock(adapter(events.mockVariableBlock)[0]);

    expect(Object.keys(existingTarget.variables).length).toBe(1);
    const existingVariable = Object.values(existingTarget.variables)[0];
    expect(existingVariable.name).toBe('a mock variable');
    expect(Object.keys(target.variables).length).toBe(0);
    expect(Object.keys(stage.variables).length).toBe(0);
    expect(typeof target.blocks.getBlock('a block')).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');

    target.fixUpVariableReferences();

    expect(Object.keys(existingTarget.variables).length).toBe(1);
    expect(existingVariable.name).toBe('a mock variable');
    expect(Object.keys(target.variables).length).toBe(0);
    expect(Object.keys(stage.variables).length).toBe(1);
    expect(typeof target.blocks.getBlock('a block')).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');
    const newGlobal = stage.variables[Object.keys(stage.variables)[0]];
    expect(newGlobal.name).toBe('a mock variable2');
});

test('fixUpVariableReferences does not change variable name if there is no variable conflict', () => {
    const runtime = new Runtime();

    const stage = new Target(runtime);
    stage.isStage = true;

    const target = new Target(runtime);
    target.isStage = false;
    target.getName = () => 'Target';

    runtime.targets = [stage, target];

    // Create a global variable
    stage.createVariable('pre-existing global var id', 'a variable', Variable.SCALAR_TYPE);
    stage.createVariable('pre-existing global list id', 'a mock variable', Variable.LIST_TYPE);
    target.createVariable('mock var id', 'a mock variable', Variable.SCALAR_TYPE);

    target.blocks.createBlock(adapter(events.mockVariableBlock)[0]);

    expect(Object.keys(target.variables).length).toBe(1);
    expect(Object.keys(stage.variables).length).toBe(2);
    expect(typeof target.blocks.getBlock('a block')).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');
    expect(target.variables['mock var id'].name).toBe('a mock variable');

    target.fixUpVariableReferences();

    expect(Object.keys(target.variables).length).toBe(1);
    expect(Object.keys(stage.variables).length).toBe(2);
    expect(typeof target.blocks.getBlock('a block')).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields).toBe('object');
    expect(typeof target.blocks.getBlock('a block').fields.VARIABLE).toBe('object');
    expect(target.blocks.getBlock('a block').fields.VARIABLE.id).toBe('mock var id');
    expect(target.variables['mock var id'].name).toBe('a mock variable');
});
