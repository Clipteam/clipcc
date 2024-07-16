/**
 * Create procedures from given state and add them to the workspace.
 * @param {!Object} states The states of procedures.
 * @param {!Blockly.Workspace} workspace The workspace to which the procedures
 *     should be added.
 */
export const load = function(states, workspace) {
  for (const state of states) {
    workspace.createProcedureFromMutation(state);
  }
};
