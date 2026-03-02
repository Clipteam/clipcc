/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Notifies listeners when some element of a block has changed (e.g.
 * field values, comments, etc).
 */
export class BlockChange extends Blockly.Events.BlockChange {
  /**
   * Run a change event.
   * @param forward True if run forward, false if run backward (undo).
   */
  override run(forward: boolean) {
    const workspace = this.getEventWorkspace_();
    if (!this.blockId) {
      throw new Error('The block ID is undefined. Either pass a block to the constructor, or call fromJson.');
    }
    const block = workspace.getBlockById(this.blockId);
    if (!block) {
      throw new Error('The associated block is undefined. Either pass a block to the constructor, or call fromJson.');
    }
    // Assume the block is rendered so that then we can check.
    const icon = block.getIcon(Blockly.icons.IconType.MUTATOR);
    if (icon && Blockly.hasBubble(icon) && icon.bubbleIsVisible()) {
      // Close the mutator (if open) since we don't want to update it.
      icon.setBubbleVisible(false);
    }
    const value = forward ? this.newValue : this.oldValue;
    switch (this.element) {
      case 'field': {
        const field = block.getField(this.name!);
        if (field) {
          field.setValue(value);
        } else {
          console.warn(`Can't set non-existent field: ${this.name}`);
        }
        break;
      }
      case 'comment':
        // Fix Blockly#6708: Undo and redo fail to re-add comment to block.
        block.setCommentText(typeof value === 'string' ? value : null);
        break;
      case 'collapsed':
        block.setCollapsed(!!value);
        break;
      case 'disabled':
        block.setDisabledReason(
          !!value,
          // @ts-expect-error Accessing private property disabledReason
          this.disabledReason ?? Blockly.constants.MANUALLY_DISABLED
        );
        break;
      case 'inline':
        block.setInputsInline(!!value);
        break;
      case 'mutation': {
        const oldState = BlockChange.getExtraBlockState_(block as Blockly.BlockSvg);
        if (block.loadExtraState) {
          block.loadExtraState(JSON.parse((value as string) || '{}'));
        } else if (block.domToMutation) {
          block.domToMutation(
            Blockly.utils.xml.textToDom((value as string) || '<mutation/>')
          );
        }
        Blockly.Events.fire(
          new BlockChange(block, 'mutation', null, oldState, value)
        );
        break;
      }
      default:
        console.warn('Unknown change type: ' + this.element);
    }
  }
}

Blockly.registry.register(Blockly.registry.Type.EVENT, Blockly.Events.BLOCK_CHANGE, BlockChange, true);
