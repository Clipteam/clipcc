/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Registers the "Add Comment" context menu item.
 * It has slightly different preconditions compared to the default Blockly one.
 */
export function registerAddBlockComment() {
  const original = Blockly.ContextMenuRegistry.registry.getItem('blockComment')!;
  const blockCommentOption = {
    ...original,
    preconditionFn: function(scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (
        block &&
        !block.isInFlyout &&
        block.workspace.options.comments &&
        !block.isCollapsed() &&
        block.isEditable()
      ) {
        return 'enabled';
      }
      return 'hidden';
    }
  } as Blockly.ContextMenuRegistry.RegistryItem;

  Blockly.ContextMenuRegistry.registry.unregister(blockCommentOption.id);
  Blockly.ContextMenuRegistry.registry.register(blockCommentOption);
}
