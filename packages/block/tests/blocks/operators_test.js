/**
 * @license
 * Copyright 2024 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

function test_operator_join_multiple() {
  const workspace = new Blockly.Workspace();
  try {
    const xml = '<xml xmlns="http://www.w3.org/1999/xhtml">' +
      '<mutation argumentids="[&quot;STRING1&quot;, &quot;STRING2&quot;]"></mutation></xml>';
    const mutation = Blockly.Xml.textToDom(xml).firstChild;
    const block = workspace.newBlock('operator_join_multiple');
    block.domToMutation(mutation);

    // should have 1 field input, 2 arguments and 1 plus minus field input
    assertEquals(4, block.inputList && block.inputList.length);
    
    // it is not allow to remove input when there's only 2 arguments
    block.handleMinus_();
    assertEquals(4, block.inputList.length);

    // append a input
    block.insertInputWithIndex_(block.argumentIds_.length + 1, 'STRING3');
    assertEquals(5, block.inputList.length);
    assertTrue(block.inputList[3].name === 'STRING3');

    // insert a input, 1-based
    block.insertInputWithIndex_(2, 'STRING4');
    assertEquals(6, block.inputList.length);
    assertTrue(block.inputList[2].name === 'STRING4');
    assertTrue(block.inputList[3].name === 'STRING2');

    // remove a input, 1-based
    block.removeInputWithIndex_(3);
    assertEquals(5, block.inputList.length);
    assertTrue(block.inputList[3].name === 'STRING3');
  } finally {
    workspace.dispose();
  }
}
