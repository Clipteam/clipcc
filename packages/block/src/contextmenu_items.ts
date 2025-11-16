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


/**
 * Determines whether a block is deletable.
 * @param block The block to check.
 * @returns True if the block is deletable.
 */
function isDeletable(block: Blockly.BlockSvg): boolean {
  return block.isDeletable() && !block.isShadow();
}

/**
 * Constructs a list of blocks that can be deleted in the given workspace.
 * @param workspace workspace to delete all blocks from
 * @returns list of blocks to delete.
 */
function getDeletableBlocks(workspace: Blockly.WorkspaceSvg): Blockly.BlockSvg[] {
  const deleteList: Blockly.BlockSvg[] = [];
  const topBlocks = workspace.getTopBlocks(true);
  for (const topBlock of topBlocks) {
    for (const block of topBlock.getDescendants(false)) {
      if (isDeletable(block)) {
        deleteList.push(block);
      }
    }
  }
  return deleteList;
}

/**
 * Get deletable blocks in a stack, excluding next blocks.
 * @param block Top block of the stack.
 * @returns Deletable blocks in the stack.
 */
function getDeletableBlocksInStack(block: Blockly.BlockSvg): Blockly.BlockSvg[] {
  return block.getDescendants(false).filter(isDeletable);
}

/**
 * Delete given blocks.
 * @param blocks Blocks to delete.
 */
function deleteBlocks(blocks: Blockly.BlockSvg[]) {
  Blockly.Events.setGroup(true);
  deleteBlocksInternal(blocks);
  Blockly.Events.setGroup(false);
}

/**
 * Recursively delete blocks, waiting for dying blocks to be disposed.
 * @param blocks Blocks to delete,
 */
function deleteBlocksInternal(blocks: Blockly.BlockSvg[]) {
  const dyingBlocks: Set<Blockly.BlockSvg> = new Set();
  const DELAY = 10;
  for (const block of blocks) {
    if (block.isDeadOrDying()) {
      dyingBlocks.add(block);
      continue;
    }
    block.dispose(false, true);
  }

  if (dyingBlocks.size) {
    setTimeout(() => {
      deleteBlocksInternal(Array.from(dyingBlocks));
    }, DELAY);
  }
}

/**
 * Option to delete all blocks that ignores shadows in the block count.
 */
export function registerDeleteAll() {
  const original = Blockly.ContextMenuRegistry.registry.getItem('workspaceDelete')!;
  const deleteOption: Blockly.ContextMenuRegistry.RegistryItem = {
    ...original,
    displayText(scope: Blockly.ContextMenuRegistry.Scope) {
      if (!scope.workspace) {
        return '';
      }

      const deletableBlocksLength = getDeletableBlocks(scope.workspace).length;
      if (deletableBlocksLength === 1) {
        return Blockly.Msg['DELETE_BLOCK'];
      }
      return Blockly.Msg['DELETE_X_BLOCKS'].replace('%1', `${deletableBlocksLength}`);
    },
    preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
      if (!scope.workspace) {
        return 'disabled';
      }
      const deletableBlocksLength = getDeletableBlocks(scope.workspace).length;
      return deletableBlocksLength > 0 ? 'enabled' : 'disabled';
    },
    callback(scope: Blockly.ContextMenuRegistry.Scope) {
      if (!scope.workspace) {
        return;
      }
      scope.workspace.cancelCurrentGesture();
      const blocksToDelete = getDeletableBlocks(scope.workspace);

      Blockly.dialog.confirm(
        Blockly.Msg['DELETE_ALL_BLOCKS'].replace(
          '%1',
          String(blocksToDelete.length)
        ),
        function(ok) {
          if (ok) {
            deleteBlocks(blocksToDelete);
          }
        }
      );
    }
  } as Blockly.ContextMenuRegistry.RegistryItem;

  Blockly.ContextMenuRegistry.registry.unregister(original.id);
  Blockly.ContextMenuRegistry.registry.register(deleteOption);
}

/**
 * Registers a block delete option that ignores shadows in the block count.
 */
export function registerDeleteStackedBlock() {
  const original = Blockly.ContextMenuRegistry.registry.getItem('blockDelete');
  const deleteOption = {
    ...original,
    displayText(scope: Blockly.ContextMenuRegistry.Scope) {
      const descendantCount = getDeletableBlocksInStack(scope.block!).length;
      return descendantCount === 1 ?
        Blockly.Msg['DELETE_BLOCK'] :
        Blockly.Msg['DELETE_X_BLOCKS'].replace('%1', `${descendantCount}`);
    },
    preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
      if (!scope.block!.isInFlyout && scope.block!.isDeletable()) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback(scope: Blockly.ContextMenuRegistry.Scope) {
      deleteBlocks([scope.block!]);
    }
  } as Blockly.ContextMenuRegistry.RegistryItem;
  Blockly.ContextMenuRegistry.registry.unregister(original!.id);
  Blockly.ContextMenuRegistry.registry.register(deleteOption);
}

/**
 * Registers a block duplicate option that duplicates the selected block and
 * its descendants.
 */
export function registerDuplicateStackedBlock() {
  const original =
    Blockly.ContextMenuRegistry.registry.getItem('blockDuplicate');
  const duplicateOption = {
    ...original,
    callback(scope: Blockly.ContextMenuRegistry.Scope) {
      if (!scope.block) return;

      // Copy data of the block and its descendants.
      const data = scope.block.toCopyData(true);
      if (!data) return;
      Blockly.clipboard.paste(data, scope.block.workspace);
    }
  } as Blockly.ContextMenuRegistry.RegistryItem;
  Blockly.ContextMenuRegistry.registry.unregister(duplicateOption.id);
  Blockly.ContextMenuRegistry.registry.register(duplicateOption);
}

/**
 * Registers a context menu item to copy block data to the clipboard.
 */
export function registerCopyToPasteboard() {
  const copyOption: Blockly.ContextMenuRegistry.RegistryItem = {
    id: 'blockCopyToClipboard',
    weight: 4,
    displayText: Blockly.Msg['COPY'],
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
      return scope.block && !scope.block.isInFlyout ? 'enabled' : 'hidden';
    },
    callback(scope: Blockly.ContextMenuRegistry.Scope) {
      if (!scope.block) return;

      const data = scope.block.toCopyData(true);
      if (!data) return;

      const jsonString = JSON.stringify(data);
      navigator.clipboard.writeText(jsonString);
    }
  };

  Blockly.ContextMenuRegistry.registry.register(copyOption);
}

/**
 * Registers a context menu item to paste block data from the clipboard.
 */
export function registerPasteFromPasteboard() {
  const pasteOption: Blockly.ContextMenuRegistry.RegistryItem = {
    id: 'blockPasteFromClipboard',
    weight: 4,
    displayText: Blockly.Msg['PASTE'],
    scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    preconditionFn(scope: Blockly.ContextMenuRegistry.Scope) {
      return scope.workspace?.isMutator ? 'hidden' : 'enabled';
    },
    callback(
      scope: Blockly.ContextMenuRegistry.Scope,
      menuOpenEvent: Event,
      menuSelectEvent: Event,
      location: Blockly.utils.Coordinate
    ) {
      if (!scope.workspace) return;

      navigator.clipboard.readText().then((text) => {
        try {
          const data: Blockly.clipboard.BlockCopyData = JSON.parse(text);
          const wsLocation = Blockly.utils.svgMath.screenToWsCoordinates(
            scope.workspace!,
            location
          );
          Blockly.clipboard.paste(data, scope.workspace!, wsLocation);
        } catch (e) {
          console.error('Failed to parse clipboard data as JSON.', e);
        }
      });
    }
  };
  Blockly.ContextMenuRegistry.registry.register(pasteOption);
}
