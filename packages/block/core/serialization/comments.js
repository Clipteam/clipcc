import * as eventUtils from '../events/utils';
import {WorkspaceComment} from '../workspace_comment';
import {WorkspaceCommentSvg} from '../workspace_comment_svg';

/**
 * Create a workspace comment from given state.
 * @param {!State} state The state of a workspace comment to deserialize into the workspace.
 * @param {!Workspace} workspace The workspace to add the block to.
 * @param {number=} opt_wsWidth The width for coordinate calculation need.
 */
const createCommentFromState = function(state, workspace, opt_wsWidth) {
  let comment;
  if (workspace.rendered) {
    eventUtils.disable();
    try {
      comment = new WorkspaceCommentSvg(workspace,
          state.content, state.h, state.w, state.minimized, state.id);
      comment.initSvg();
      comment.render(false);
      // Position the comment correctly, taking into account the width of a
      // rendered RTL workspace.
      if (!isNaN(state.x) && !isNaN(state.y)) {
        if (workspace.RTL) {
          const wsWidth = opt_wsWidth || workspace.getWidth();
          comment.moveBy(wsWidth - state.x, state.y);
        } else {
          comment.moveBy(state.x, state.y);
        }
      }
    } finally {
      eventUtils.enable();
    }
    WorkspaceComment.fireCreateEvent(comment);
  } else {
    comment = new WorkspaceComment(
        workspace, state.content, state.h, state.w, state.minimized, state.id);

    if (!isNaN(state.x) && !isNaN(state.y)) {
      comment.moveBy(state.x, state.y);
    }

    WorkspaceComment.fireCreateEvent(comment);
  }
};

/**
 * Loads the workspace comments represented by the given state into the given workspace.
 * @param {!State} state The state of a workspace comment to deserialize into the workspace.
 * @param {!Workspace} workspace The workspace to add the block to.
 * @param {number=} opt_wsWidth The width for coordinate calculation need.
 */
export const load = function(state, workspace, opt_wsWidth) {
  for (const commentState of state) {
    createCommentFromState(commentState, workspace, opt_wsWidth);
  }
};

/**
 * Returns the state of the given block as a plain JavaScript object.
 * @param {!Workspace} workspace The workspace to serialize.
 * @returns {!State} the comment states belongs to workspace.
 */
export const save = function(workspace) {
  const commentStates = [];
  const comments = workspace.getTopComments(true).filter(function(topComment) {
    return topComment instanceof WorkspaceComment;
  });

  for (let i = 0, comment; comment = comments[i]; i++) {
    commentStates.push(comment.toStateWithXY());
  }
  return commentStates;
};
