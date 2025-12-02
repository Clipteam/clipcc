/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {isCheckboxInFlyout} from '../../interfaces/i_checkbox_in_flyout';
import {FlyoutCheckbox} from '../flyout_checkbox';
import {getCheckboxState} from '../../utils';

export class BlockFlyoutInflater extends Blockly.BlockFlyoutInflater {
  static readonly TYPE = 'block';

  /**
   * Whether or not block recycling is enabled.
   */
  recyclingEnabled = false;

  /**
   * Map from block type to block instance.
   */
  private recycledBlocks = new Map<string, Blockly.BlockSvg>();

  /**
   * Custom function to use for checking whether or not blocks can be recycled.
   */
  recycleEligibilityChecker?: (block: Blockly.Block) => boolean;

  /**
   * Creates a new block from the given block definition.
   * @param blockDefinition The definition to create a block from.
   * @param workspace The workspace to create the block on.
   * @returns The newly created block.
   */
  override createBlock(
    blockDefinition: Blockly.utils.toolbox.BlockInfo,
    workspace: Blockly.WorkspaceSvg
  ): Blockly.BlockSvg {
    const blockType = this.getTypeFromDefinition(blockDefinition);
    return (
      this.getRecycledBlock(blockType) ??
      super.createBlock(blockDefinition, workspace)
    );
  }

  /**
   * Returns the type of a block from an XML or JSON block definition.
   * @param blockDefinition The block definition to parse.
   * @returns The block type.
   */
  private getTypeFromDefinition(
    blockDefinition: Blockly.utils.toolbox.BlockInfo
  ): string {
    let type: string | null | undefined;
    if (blockDefinition['blockxml']) {
      const xml =
        typeof blockDefinition['blockxml'] === 'string' ?
          Blockly.utils.xml.textToDom(blockDefinition['blockxml']) :
          (blockDefinition['blockxml'] as Element);
      type = xml.getAttribute('type');
    } else {
      type = blockDefinition['type'];
    }

    if (!type) {
      throw new Error(
        `Block type is not specified in block definition: ${JSON.stringify(
          blockDefinition
        )}`
      );
    }
    return type;
  }

  /**
   * Puts a previously created block into the recycle bin and moves it to the
   * top of the workspace. Used during large workspace swaps to limit the number
   * of new DOM elements we need to create.
   * @param block The block to recycle.
   */
  private recycleBlock(block: Blockly.BlockSvg) {
    const xy = block.getRelativeToSurfaceXY();
    block.moveBy(-xy.x, -xy.y);
    this.recycledBlocks.set(block.type, block);
  }

  /**
   * Returns a block from the cache of recycled blocks with the given type, or
   * undefined if one cannot be found.
   * @param blockType The type of the block to try to recycle.
   * @returns The recycled block, or undefined if one could not be recycled.
   */
  private getRecycledBlock(blockType: string): Blockly.BlockSvg | undefined {
    const block = this.recycledBlocks.get(blockType);
    this.recycledBlocks.delete(blockType);
    return block;
  }

  /**
   * Returns whether the given block can be recycled or not.
   * @param block The block to check for recyclability.
   * @returns True if the block can be recycled. False otherwise.
   */
  protected blockIsRecyclable(block: Blockly.Block): boolean {
    if (!this.recyclingEnabled) return false;

    if (this.recycleEligibilityChecker) {
      return this.recycleEligibilityChecker(block);
    }

    // If the block needs to parse mutations, never recycle.
    if (block.mutationToDom || block.domToMutation || block.saveExtraState || block.loadExtraState) {
      return false;
    }

    if (!block.isEnabled()) return false;

    for (const input of block.inputList) {
      for (const field of input.fieldRow) {
        // No variables.
        if (field.referencesVariables()) return false;

        if (field instanceof Blockly.FieldDropdown) {
          if (field.isOptionListDynamic()) return false;
        }
      }
      // Check children.
      if (input.connection) {
        const targetBlock = input.connection.targetBlock();
        if (targetBlock && !this.blockIsRecyclable(targetBlock)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Inflates a flyout block from the given state and adds it to the flyout.
   * Create a checkbox for block if checkboxInFlyout is defined.
   * @param state A JSON representation of a flyout block.
   * @param flyout The flyout to create the block on.
   * @returns A newly created block.
   */
  override load(state: object, flyout: Blockly.IFlyout): Blockly.FlyoutItem {
    const flyoutItem = super.load(state, flyout);

    // Add checkbox if checkboxInFlyout is true in block.
    const block = flyoutItem.getElement() as Blockly.BlockSvg;
    if (isCheckboxInFlyout(block) && block.checkboxInFlyout) {
      const state = getCheckboxState(block.workspace.id, block.id);
      return new Blockly.FlyoutItem(
        new FlyoutCheckbox(
          flyoutItem,
          flyout.getWorkspace(),
          flyout.targetWorkspace!,
          state,
          this.onCheckboxChange.bind(this)
        ),
        BlockFlyoutInflater.TYPE
      );
    }

    return flyoutItem;
  }

  /**
   * Dispose the flyout item.
   * @param item The flyout item to dispose of.
   */
  override disposeItem(item: Blockly.FlyoutItem): void {
    const element = item.getElement();
    if (element instanceof FlyoutCheckbox) {
      const childItem = element.getChildItem();
      if (childItem) {
        super.disposeItem(childItem);
      }
      element.dispose();
    } else if (element instanceof Blockly.BlockSvg &&
      this.blockIsRecyclable(element)
    ) {
      this.removeListeners(element.id);
      this.recycleBlock(element);
    } else {
      super.disposeItem(item);
    }
  }

  /**
   * Clears the cache of recycled blocks.
   */
  emptyRecycledBlocks() {
    this.recycledBlocks.forEach((block) => block.dispose(false, false));
    this.recycledBlocks.clear();
  }

  /**
   * Event handler triggered when the checkbox state is changed.
   * @param newChecked The new checkbox state.
   * @param checkbox The checkbox instance.
   */
  protected onCheckboxChange(newChecked: boolean, checkbox: FlyoutCheckbox) {
    // Fire a block change event when checkbox state changes.
    if (Blockly.Events.isEnabled()) {
      const block = checkbox.getChildItem()!.getElement();
      Blockly.Events.fire(
        new (Blockly.Events.get(Blockly.Events.BLOCK_CHANGE))(
          block,
          'checkbox',
          null,
          !newChecked,
          newChecked
        )
      );
    }
  }
}

Blockly.registry.register(
  Blockly.registry.Type.FLYOUT_INFLATER,
  BlockFlyoutInflater.TYPE,
  BlockFlyoutInflater,
  true
);
