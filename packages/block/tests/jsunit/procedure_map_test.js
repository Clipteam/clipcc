/**
 * @license
 * Copyright 2024 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

goog.require('goog.testing');
goog.require('goog.testing.MockControl');

var workspace;
var procedureMap;
var mockControl_;

function procedureMapTest_setUp() {
  workspace = new Blockly.Workspace();
  procedureMap = workspace.getProcedureMap();
  mockControl_ = new goog.testing.MockControl();
}

function procedureMapTest_tearDown() {
  mockControl_.$tearDown();
  workspace.dispose();
}

function test_procedureMap_newProcedure() {
  const json = {
    procedures: [{
      proccode: 'test proc',
      argumentids: '[]',
      argumentnames: '[]',
      argumentdefaults: '[]',
      warp: true,
      return: false,
      global: false
    }]
  };
  procedureMapTest_setUp();
  try {
    Blockly.serialization.workspace.load(json, workspace);
    const procedure = procedureMap.getProcedure('test proc');
    assertNotNull(procedure);
    assertEquals('test proc', procedure.getProcCode());
    assertEquals(false, procedure.isExternal());
    assertEquals(true, JSON.parse(procedure.mutation['warp']));
    assertEquals(false, JSON.parse(procedure.mutation['return']));
    assertEquals(false, JSON.parse(procedure.mutation['global']));
  } finally {
    procedureMapTest_tearDown();
  }
}

function test_procedureMap_newProcedure_conflictName() {
  const json = {
    procedures: [{
      proccode: 'test proc',
      argumentids: '[]',
      argumentnames: '[]',
      argumentdefaults: '[]',
      warp: true,
      return: false,
      global: false
    }]
  };
  const newMutation = {
    proccode: 'test proc',
    argumentids: '[]',
    argumentnames: '[]',
    argumentdefaults: '[]',
    warp: true,
    return: false,
    global: false
  };
  procedureMapTest_setUp();
  try {
    Blockly.serialization.workspace.load(json, workspace);

    const mock = mockControl_.createMethodMock(console, 'warn');
    mock('Procedure "test proc" is already in use.').$once();
    mock.$replay();
    const procedure = workspace.createProcedureFromMutation(newMutation);
    mock.$verify();

    assertNotNull(procedure);
    assertEquals('test proc', procedure.getProcCode());
    assertEquals(false, procedure.isExternal());
  } finally {
    procedureMapTest_tearDown();
  }
}

function test_procedureMap_newProcedure_coverExternalGlobal() {
  const json = {
    procedures: [{
      proccode: 'test proc',
      argumentids: '[]',
      argumentnames: '[]',
      argumentdefaults: '[]',
      warp: true,
      return: false,
      global: true,
      external: true
    }]
  };
  const newMutation = {
    proccode: 'test proc',
    argumentids: '[]',
    argumentnames: '[]',
    argumentdefaults: '[]',
    warp: true,
    return: false,
    global: false
  };
  procedureMapTest_setUp();
  try {
    Blockly.serialization.workspace.load(json, workspace);
    let procedure = procedureMap.getProcedure('test proc');
    assertEquals(true, procedure.isExternal());

    const mock = mockControl_.createMethodMock(console, 'warn');
    mock('Procedure "test proc" is already in use.').$never();
    mock.$replay();
    workspace.createProcedureFromMutation(newMutation);
    mock.$verify();

    procedure = procedureMap.getProcedure('test proc');
    assertNotNull(procedure);
    assertEquals('test proc', procedure.getProcCode());
    assertEquals(false, procedure.isExternal());
  } finally {
    procedureMapTest_tearDown();
  }
}

function test_procedureMap_newProcedure_externalAfterLocalCovered() {
  const json = {
    procedures: [{
      proccode: 'test proc',
      argumentids: '[]',
      argumentnames: '[]',
      warp: true,
      return: false,
      global: false
    }]
  };
  const newMutation = {
    proccode: 'test proc',
    argumentids: '[]',
    argumentnames: '[]',
    argumentdefaults: '[]',
    warp: true,
    return: false,
    global: true,
    external: true
  };
  try {
    Blockly.serialization.workspace.load(json, workspace);
    let procedure = procedureMap.getProcedure('test proc');
    assertEquals(false, procedure.isExternal());

    const mock = mockControl_.createMethodMock(console, 'warn');
    mock('Procedure "test proc" is already in use.').$never();
    mock.$replay();
    workspace.createProcedureFromMutation(newMutation);
    mock.$verify();

    procedure = procedureMap.getProcedure('test proc');
    assertNotNull(procedure);
    assertEquals('test proc', procedure.getProcCode());
    assertEquals(false, procedure.isExternal());
  } finally {
    procedureMapTest_tearDown();
  }
}

function test_procedureMap_getProcedure_localFirst() {
  const json = {
    proccode: 'test proc',
    argumentids: '[]',
    argumentnames: '[]',
    argumentdefaults: '[]',
    warp: true,
    return: false,
    global: true,
    external: true
  };
  procedureMapTest_setUp();
  try {
    const mutation1 = json;
    const mutation2 = {
      ...json,
      global: false,
      external: false
    };

    procedureMap.createProcedureFromMutation(mutation1);
    procedureMap.createProcedureFromMutation(mutation2);

    const procedure = procedureMap.getProcedure('test proc');

    assertNotNull(procedure);
    assertEquals('test proc', procedure.getProcCode());
    assertEquals(false, procedure.isGlobal());
  } finally {
    procedureMapTest_tearDown();
  }
}
