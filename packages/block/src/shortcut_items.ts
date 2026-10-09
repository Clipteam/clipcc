/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Registers a shortcut overriding the default copy behavior, allowing copying
 * of the currently focused block.
 */
export function registerCopyShortcut() {
  const originalShortcut = Blockly.ShortcutRegistry.registry.getRegistry()[Blockly.ShortcutItems.names.COPY];
  const copyShortcut: Blockly.ShortcutRegistry.KeyboardShortcut = {
    ...originalShortcut,
    allowCollision: true,
    callback(workspace, e, shortcut, scope) {
      // Prevent the default copy behavior, which may beep or otherwise indicate
      // an error due to the lack of a selection.
      e.preventDefault();

      const focused = scope.focusedNode;
      if (!(focused instanceof Blockly.BlockSvg)) {
        return originalShortcut.callback?.(workspace, e, shortcut, scope) ?? false;
      }
      if (workspace.isFlyout) return false;

      const data = focused.toCopyData(true);
      if (!data) return false;
      Blockly.clipboard.setLastCopiedData(data);
      Blockly.clipboard.setLastCopiedWorkspace(focused.workspace);
      Blockly.clipboard.setLastCopiedLocation(focused.getRelativeToSurfaceXY());
      return true;
    }
  };
  Blockly.ShortcutRegistry.registry.register(copyShortcut, true);
}

/**
 * Registers a shortcut overriding the default cut behavior, allowing cutting
 * of the currently focused block.
 */
export function registerCutShortcut() {
  const originalShortcut = Blockly.ShortcutRegistry.registry.getRegistry()[Blockly.ShortcutItems.names.CUT];
  const cutShortcut: Blockly.ShortcutRegistry.KeyboardShortcut = {
    ...originalShortcut,
    allowCollision: true,
    callback(workspace, e, shortcut, scope) {
      // Prevent the default cut behavior, which may beep or otherwise indicate
      // an error due to the lack of a selection.
      e.preventDefault();

      const focused = scope.focusedNode;
      if (!(focused instanceof Blockly.BlockSvg)) {
        return originalShortcut.callback?.(workspace, e, shortcut, scope) ?? false;
      }
      if (workspace.isFlyout) return false;

      const data = focused.toCopyData(true);
      if (!data) return false;
      Blockly.clipboard.setLastCopiedData(data);
      Blockly.clipboard.setLastCopiedWorkspace(focused.workspace);
      Blockly.clipboard.setLastCopiedLocation(focused.getRelativeToSurfaceXY());
      focused.checkAndDelete();
      return true;
    }
  };
  Blockly.ShortcutRegistry.registry.register(cutShortcut, true);
}

/**
 * Registers all Scratch-specific keyboard shortcuts.
 * Will override some default Blockly keyboard shortcuts.
 */
export function registerScratchShortcuts() {
  registerCopyShortcut();
  registerCutShortcut();
}
