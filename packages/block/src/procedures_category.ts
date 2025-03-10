/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Utility functions for handling procedures.
 * @author fraser@google.com (Neil Fraser)
 */

import * as Blockly from 'blockly/core';
import {compareStrings} from './utils';
import {ProcedureModel} from './procedure_model';
import {ParameterModel} from './parameter_model';
import {ProcedureExtraState} from './serialization/procedures';

/**
 * Construct the blocks required by the flyout for the procedure category.
 * @param workspace The workspace contianing procedures.
 * @returns Array of XML block elements.
 */
export function flyoutCategory(workspace: Blockly.WorkspaceSvg): Blockly.utils.toolbox.FlyoutItemInfoArray {
  const toolboxDef: Blockly.utils.toolbox.FlyoutItemInfoArray = [];

  // Create the "Make a Block..." button.
  toolboxDef.push({
    kind: 'button',
    text: Blockly.Msg.NEW_PROCEDURE,
    callbackkey: 'CREATE_PROCEDURE'
  });
  workspace.registerButtonCallback('CREATE_PROCEDURE', function() {
    const model = new ProcedureModel(workspace, 'test %s');
    model.insertParameter(new ParameterModel(workspace, 'str'), 0);
    workspace.getProcedureMap().add(model);
    workspace.refreshToolboxSelection();
  });

  // Create the "Return" block.
  toolboxDef.push({
    kind: 'block',
    type: 'procedures_return',
    inputs: {
      VALUE: {
        shadow: {
          type: 'text',
          fields: {TEXT: 0}
        }
      }
    }
  });

  // Create call blocks for each procedure
  const states = allProcedureStates(workspace);
  for (const state of states) {
    toolboxDef.push({
      kind: 'block',
      type: 'procedures_call',
      extraState: state
    });
  }

  return toolboxDef;
}

/**
 * Find all procedure definition in workspace.
 * @param root Root workspace.
 * @returns Array of procedure states.
 */
function allProcedureStates(root: Blockly.Workspace): ProcedureExtraState[] {
  const procedures = root.getProcedureMap().getProcedures() as ProcedureModel[];
  const states: ProcedureExtraState[] = [];
  for (const procedure of procedures) {
    states.push(procedure.saveExtraState());
  }
  return states.sort((a, b) => {
    return compareStrings(a.proccode, b.proccode);
  });
}
