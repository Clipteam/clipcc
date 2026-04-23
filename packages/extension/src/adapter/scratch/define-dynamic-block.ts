/**
 * @license
 * Copyright 2019 Massachusetts Institute of Technology
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type * as Blocks from 'clipcc-block'; // @todo for type checker only.

// TODO: access `BlockType` and `ArgumentType` without reaching into VM
// Should we move these into a new extension support module or something?
import BlockType from './types/block-type';
import ArgumentType from './types/argument-type';
import ScratchBlocksConstants from './types/scratch-blocks-constants';

interface DynamicBlock extends Blocks.Block, Blocks.ICheckboxInFlyout {
    blockInfoText: string;
    needsBlockInfoUpdate?: boolean;
}

/**
 * Define a block using extension info which has the ability to dynamically determine (and update) its layout.
 * This functionality is used for extension blocks which can change its properties based on different state
 * information. For example, the `control_stop` block changes its shape based on which menu item is selected
 * and a variable block changes its text to reflect the variable name without using an editable field.
 * @param categoryInfo - Information about this block's extension category, including any menus and icons.
 * @param staticBlockInfo - The base block information before any dynamic changes.
 * @param extendedOpcode - The opcode for the block (including the extension ID).
 */
// TODO: grow this until it can fully replace `_convertForScratchBlocks` in the VM runtime
const defineDynamicBlock = (categoryInfo: any, staticBlockInfo: any, extendedOpcode: string) => ({
    init: function (this: DynamicBlock) {
        const blockJson: any = {
            type: extendedOpcode,
            inputsInline: true,
            category: categoryInfo.name,
            colour: categoryInfo.color1,
            colourSecondary: categoryInfo.color2,
            colourTertiary: categoryInfo.color3
        };
        // There is a scratch-blocks / Blockly extension called "scratch_extension" which adjusts the styling of
        // blocks to allow for an icon, a feature of Scratch extension blocks. However, Scratch "core" extension
        // blocks don't have icons and so they should not use 'scratch_extension'. Adding a scratch-blocks / Blockly
        // extension after `jsonInit` isn't fully supported (?), so we decide now whether there will be an icon.
        if (staticBlockInfo.blockIconURI || categoryInfo.blockIconURI) {
            blockJson.extensions = ['scratch_extension'];
        }
        // initialize the basics of the block, to be overridden & extended later by `domToMutation`
        this.jsonInit(blockJson);
        // initialize the cached block info used to carry block info from `domToMutation` to `mutationToDom`
        this.blockInfoText = '{}';
        // we need a block info update (through `domToMutation`) before we have a completely initialized block
        this.needsBlockInfoUpdate = true;
    },
    mutationToDom: function (this: DynamicBlock) {
        const container = document.createElement('mutation');
        container.setAttribute('blockInfo', this.blockInfoText);
        return container;
    },
    domToMutation: function (this: DynamicBlock, xmlElement: Element) {
        const blockInfoText = xmlElement.getAttribute('blockInfo');
        if (!blockInfoText) return;
        if (!this.needsBlockInfoUpdate) {
            throw new Error('Attempted to update block info twice');
        }
        delete this.needsBlockInfoUpdate;
        this.blockInfoText = blockInfoText;
        const blockInfo = JSON.parse(blockInfoText);

        switch (blockInfo.blockType) {
        case BlockType.COMMAND:
        case BlockType.CONDITIONAL:
        case BlockType.LOOP:
            this.setOutputShape(ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE);
            this.setPreviousStatement(true);
            this.setNextStatement(!blockInfo.isTerminal);
            break;
        case BlockType.REPORTER:
            this.setOutput(true);
            this.setOutputShape(ScratchBlocksConstants.OUTPUT_SHAPE_ROUND);
            if (!blockInfo.disableMonitor) {
                this.checkboxInFlyout = true;
            }
            break;
        case BlockType.BOOLEAN:
            this.setOutput(true);
            this.setOutputShape(ScratchBlocksConstants.OUTPUT_SHAPE_HEXAGONAL);
            break;
        case BlockType.HAT:
        case BlockType.EVENT:
            this.setOutputShape(ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE);
            this.setNextStatement(true);
            break;
        }

        if (blockInfo.color1 || blockInfo.color2 || blockInfo.color3) {
            // `setColour` handles undefined parameters by adjusting defined colors
            this.setColour(blockInfo.color1);
        }

        // Layout block arguments
        // TODO handle E/C Blocks
        const blockText = blockInfo.text as string;
        const args: any[] = [];
        let argCount = 0;
        const scratchBlocksStyleText = blockText.replace(/\[(.+?)]/g, (match, argName) => {
            const arg = blockInfo.arguments[argName];
            switch (arg.type) {
            case ArgumentType.STRING:
                args.push({type: 'input_value', name: argName});
                break;
            case ArgumentType.BOOLEAN:
                args.push({type: 'input_value', name: argName, check: 'Boolean'});
                break;
            }
            return `%${++argCount}`;
        });
        this['interpolate'](scratchBlocksStyleText, args);
    }
});

export default defineDynamicBlock;
