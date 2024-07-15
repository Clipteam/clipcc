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
  const xml = '<xml xmlns="http://www.w3.org/1999/xhtml"><procedures>' +
    '<mutation proccode="test proc" ' +
      'argumentids="" argumentnames="" argumentdefaults="" ' +
      'warp="true" return="false" global="false"></mutation>' +
  '</procedures></xml>';
  procedureMapTest_setUp();
  try {
    Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), workspace);
    const procedure = procedureMap.getProcedure('test proc');
    assertNotNull(procedure);
    assertEquals('test proc', procedure.getProcCode());
    assertEquals(false, procedure.isExternal());
    assertEquals(true, JSON.parse(procedure.mutation.getAttribute('warp')));
    assertEquals(false, JSON.parse(procedure.mutation.getAttribute('return')));
    assertEquals(false, JSON.parse(procedure.mutation.getAttribute('global')));
  } finally {
    procedureMapTest_tearDown();
  }
}

function test_procedureMap_newProcedure_conflictName() {
  const xml = '<xml xmlns="http://www.w3.org/1999/xhtml"><procedures>' +
    '<mutation proccode="test proc" ' +
      'argumentids="" argumentnames="" argumentdefaults="" ' +
      'warp="true" return="false" global="false"></mutation>' +
  '</procedures></xml>';
  const newMutation = '<xml><mutation proccode="test proc" ' +
      'argumentids="" argumentnames="" argumentdefaults="" ' +
      'warp="true" return="false" global="false"></mutation></xml>';
  procedureMapTest_setUp();
  try {
    Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), workspace);

    const mock = mockControl_.createMethodMock(console, 'warn');
    mock('Procedure "test proc" is already in use.').$once();
    mock.$replay();
    const procedure = workspace.createProcedureFromMutation(Blockly.Xml.textToDom(newMutation).firstChild);
    mock.$verify();

    assertNotNull(procedure);
    assertEquals('test proc', procedure.getProcCode());
    assertEquals(false, procedure.isExternal());
  } finally {
    procedureMapTest_tearDown();
  }
}

function test_procedureMap_newProcedure_coverExternalGlobal() {
  const xml = '<xml xmlns="http://www.w3.org/1999/xhtml"><procedures>' +
    '<mutation proccode="test proc" ' +
      'argumentids="" argumentnames="" argumentdefaults="" ' +
      'warp="true" return="false" global="true" external="true"></mutation>' +
  '</procedures></xml>';
  const newMutation = '<xml><mutation proccode="test proc" ' +
      'argumentids="" argumentnames="" argumentdefaults="" ' +
      'warp="true" return="false" global="false"></mutation></xml>';
  procedureMapTest_setUp();
  try {
    Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), workspace);
    let procedure = procedureMap.getProcedure('test proc');
    assertEquals(true, procedure.isExternal());

    const mock = mockControl_.createMethodMock(console, 'warn');
    mock('Procedure "test proc" is already in use.').$never();
    mock.$replay();
    workspace.createProcedureFromMutation(Blockly.Xml.textToDom(newMutation).firstChild);
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
  const xml = '<xml xmlns="http://www.w3.org/1999/xhtml"><procedures>' +
    '<mutation proccode="test proc" ' +
      'argumentids="" argumentnames="" argumentdefaults="" ' +
      'warp="true" return="false" global="false"></mutation>' +
  '</procedures></xml>';
  const newMutation = '<xml><mutation proccode="test proc" ' +
      'argumentids="" argumentnames="" argumentdefaults="" ' +
      'warp="true" return="false" global="true" external="true"></mutation></xml>';
  procedureMapTest_setUp();
  try {
    Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), workspace);
    let procedure = procedureMap.getProcedure('test proc');
    assertEquals(false, procedure.isExternal());

    const mock = mockControl_.createMethodMock(console, 'warn');
    mock('Procedure "test proc" is already in use.').$never();
    mock.$replay();
    workspace.createProcedureFromMutation(Blockly.Xml.textToDom(newMutation).firstChild);
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
  const xml = '<xml><mutation proccode="test proc" ' +
    'argumentids="" argumentnames="" argumentdefaults="" ' +
    'warp="true" return="false" global="true" external="true"></mutation></xml>';
  procedureMapTest_setUp();
  try {
    const mutation1 = Blockly.Xml.textToDom(xml).firstChild;
    const mutation2 = mutation1.cloneNode();
    mutation2.setAttribute('global', false);
    mutation2.setAttribute('external', false);

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
