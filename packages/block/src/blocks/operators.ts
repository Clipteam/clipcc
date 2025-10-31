/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import * as Blockly from 'blockly/core';
import {FieldButton} from '../fields/button';
import {getWorkspaceOptionsFromBlock} from '../utils';

/**
 * Block for adding two numbers.
 */
Blockly.Blocks['operator_add'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_ADD,
      args0: [
        {
          type: 'input_value',
          name: 'NUM1'
        },
        {
          type: 'input_value',
          name: 'NUM2'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for subtracting two numbers.
 */
Blockly.Blocks['operator_subtract'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_SUBTRACT,
      args0: [
        {
          type: 'input_value',
          name: 'NUM1'
        },
        {
          type: 'input_value',
          name: 'NUM2'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for multiplying two numbers.
 */
Blockly.Blocks['operator_multiply'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_MULTIPLY,
      args0: [
        {
          type: 'input_value',
          name: 'NUM1'
        },
        {
          type: 'input_value',
          name: 'NUM2'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for dividing two numbers.
 */
Blockly.Blocks['operator_divide'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_DIVIDE,
      args0: [
        {
          type: 'input_value',
          name: 'NUM1'
        },
        {
          type: 'input_value',
          name: 'NUM2'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for picking a random number.
 */
Blockly.Blocks['operator_random'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_RANDOM,
      args0: [
        {
          type: 'input_value',
          name: 'FROM'
        },
        {
          type: 'input_value',
          name: 'TO'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for less than comparator.
 */
Blockly.Blocks['operator_lt'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_LT,
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND1'
        },
        {
          type: 'input_value',
          name: 'OPERAND2'
        }
      ],
      extensions: ['colours_operators', 'output_boolean']
    });
  }
};

/**
 * Block for equals comparator.
 */
Blockly.Blocks['operator_equals'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_EQUALS,
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND1'
        },
        {
          type: 'input_value',
          name: 'OPERAND2'
        }
      ],
      extensions: ['colours_operators', 'output_boolean']
    });
  }
};

/**
 * Block for greater than comparator.
 */
Blockly.Blocks['operator_gt'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_GT,
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND1'
        },
        {
          type: 'input_value',
          name: 'OPERAND2'
        }
      ],
      extensions: ['colours_operators', 'output_boolean']
    });
  }
};

/**
 * Block for 'and' boolean comparator.
 */
Blockly.Blocks['operator_and'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_AND,
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND1',
          check: 'Boolean'
        },
        {
          type: 'input_value',
          name: 'OPERAND2',
          check: 'Boolean'
        }
      ],
      extensions: ['colours_operators', 'output_boolean']
    });
  }
};

/**
 * Block for 'or' boolean comparator.
 */
Blockly.Blocks['operator_or'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_OR,
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND1',
          check: 'Boolean'
        },
        {
          type: 'input_value',
          name: 'OPERAND2',
          check: 'Boolean'
        }
      ],
      extensions: ['colours_operators', 'output_boolean']
    });
  }
};

/**
 * Block for 'not' unary boolean operator.
 */
Blockly.Blocks['operator_not'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_NOT,
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND',
          check: 'Boolean'
        }
      ],
      extensions: ['colours_operators', 'output_boolean']
    });
  }
};

/**
 * Block for string join operator.
 */
Blockly.Blocks['operator_join'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_JOIN,
      args0: [
        {
          type: 'input_value',
          name: 'STRING1'
        },
        {
          type: 'input_value',
          name: 'STRING2'
        }
      ],
      extensions: ['colours_operators', 'output_string']
    });
  }
};

interface OperatorJoinMultipleExtraState {
  argumentids: string[];
}

interface OperatorJoinMultipleBlock extends Blockly.BlockSvg {
  argumentids: string[];
  buttonMinus: FieldButton;
  buttonPlus: FieldButton;

  // Overrides
  loadExtraState(state: OperatorJoinMultipleExtraState): void;
  saveExtraState(): OperatorJoinMultipleExtraState;

  onButtonMinusClick(): void;
  onButtonPlusClick(): void;
  changeArgumentsWrapper(callback: () => void): void;
  updateDisplay(): void;
}

/**
 * Block for string join operator with multiple arguments.
 */
Blockly.Blocks['operator_join_multiple'] = {
  init: function() {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_JOIN_MULTIPLE,
      extensions: ['colours_operators', 'output_string']
    });
    this.argumentids = [];

    // Create buttons.
    this.buttonPlus = new FieldButton(
      getWorkspaceOptionsFromBlock(this).pathToMedia + 'icons/plus.svg',
      this.onButtonPlusClick.bind(this)
    );
    this.buttonMinus = new FieldButton(
      getWorkspaceOptionsFromBlock(this).pathToMedia + 'icons/minus.svg',
      this.onButtonMinusClick.bind(this)
    );
    this.appendDummyInput('DUMMY_INPUT')
      .appendField(this.buttonPlus, 'BUTTON_PLUS')
      .appendField(this.buttonMinus, 'BUTTON_MINUS');
  },
  mutationToDom: function(): Element {
    const container = document.createElement('mutation');
    container.setAttribute('argumentids', JSON.stringify(this.argumentids));
    return container;
  },
  domToMutation: function(xmlElement: Element) {
    this.loadExtraState({
      argumentids: JSON.parse(xmlElement.getAttribute('argumentids')!)
    });
  },
  saveExtraState: function(): OperatorJoinMultipleExtraState {
    return {
      argumentids: this.argumentids
    };
  },
  loadExtraState: function(state: OperatorJoinMultipleExtraState) {
    this.argumentids = Array.from(state.argumentids); // deep-copy
    this.updateDisplay();
  },
  /**
   * Add context menu option to insert inputs.
   * @param options List of menu options to add to.
   */
  customContextMenu: function(
    options: Array<
      Blockly.ContextMenuRegistry.ContextMenuOption |
      Blockly.ContextMenuRegistry.LegacyContextMenuOption
    >
  ) {
    // [WARNING] Access private startBlock here, should be fixed later. The actual
    // behaviour might be undefined.
    const startBlock: Blockly.BlockSvg | null = (this.workspace.currentGesture_! as any).startBlock;
    if (startBlock && startBlock.isShadow() && startBlock.getParent() === this) {
      // Find the index of startBlock.
      const index = this.getChildren(true).findIndex((block: Blockly.BlockSvg) => block === startBlock);
      if (index === -1) return;

      // Add Insert & Delete options.
      options.push({
        enabled: true,
        text: Blockly.Msg.INSERT_INPUT,
        callback: () => {
          this.changeArgumentsWrapper(() => {
            this.argumentids.splice(index, 0, Blockly.utils.idGenerator.genUid());
          });
        }
      }, {
        enabled: true,
        text: Blockly.Msg.DELETE_INPUT,
        callback: () => {
          this.changeArgumentsWrapper(() => {
            this.argumentids.splice(index, 1);
          });
        }
      });
    }
  },
  /**
   * Click event handler for plus button.
   */
  onButtonPlusClick: function() {
    this.changeArgumentsWrapper(() => {
      this.argumentids.push(Blockly.utils.idGenerator.genUid());
    });
  },
  /**
   * Click event handler for minus button.
   */
  onButtonMinusClick: function() {
    this.changeArgumentsWrapper(() => {
      this.argumentids.pop();
    });
  },
  /**
   * The helper function to change the argumentids.
   * @param callback The callback which performs changing.
   */
  changeArgumentsWrapper(callback: () => void): void {
    const oldExtraState = this.saveExtraState();
    callback();
    const newExtraState = this.saveExtraState();
    Blockly.Events.fire(new (Blockly.Events.get(Blockly.Events.BLOCK_CHANGE))(
      this, 'mutation', null, oldExtraState, newExtraState
    ));
    this.updateDisplay();
  },
  /**
   * Update the block's structure and appearance to match the extra states.
   */
  updateDisplay: function() {
    // Disconnect old blocks, except the label (the first one) and buttons (the last one).
    const connectionMap: {
      [key: string]: {
        shadow: Blockly.serialization.blocks.State | null,
        block: Blockly.BlockSvg
      }
    } = {};
    for (let i = 1; i < this.inputList.length - 1; ++i) {
      const input = this.inputList[i];
      if (input.connection) {
        const target = input.connection.targetBlock() as Blockly.BlockSvg;
        connectionMap[input.name] = {
          shadow: input.connection.getShadowState(true),
          block: target
        };
        if (target) {
          input.connection.disconnect();
        }
      }
    }

    // Remove all inputs, except the first one and the last one.
    for (let i = 1; i < this.inputList.length - 1; ++i) {
      this.inputList[i].dispose();
    }
    this.inputList.splice(1, this.inputList.length - 2);

    // Create all inputs.
    for (let i = 0; i < this.argumentids.length; ++i) {
      const id = this.argumentids[i];
      const input = this.appendValueInput(id);

      // Populate argument.
      let oldBlock = null;
      let oldShadow = null;
      if (connectionMap && (id in connectionMap)) {
        const saveInfo = connectionMap[id];
        oldBlock = saveInfo.block;
        oldShadow = saveInfo.shadow;
      }

      if (oldBlock) {
        // Reattach the old block and shadow input.
        delete connectionMap[input.name];
        oldBlock.outputConnection.connect(input.connection!);
        if (!oldShadow) {
          // Create a shadow input.
          oldShadow = {
            type: 'text',
            fields: {TEXT: ''}
          };
        }
        input.connection!.setShadowState(oldShadow);
      } else {
        // Create a new shadow block and attach it to the given input.
        Blockly.Events.disable();
        let newBlock;
        try {
          newBlock = this.workspace.newBlock('text');
          newBlock.setFieldValue('', 'TEXT');
          newBlock.setShadow(true);
          if (!this.isInsertionMarker()) {
            newBlock.initSvg();
          }
        } finally {
          Blockly.Events.enable();
        }
        if (Blockly.Events.isEnabled()) {
          Blockly.Events.fire(new (Blockly.Events.get(Blockly.Events.BLOCK_CREATE))(newBlock));
        }
        newBlock.outputConnection.connect(input.connection!);
      }
    }

    // Delete unused shadow.
    for (const id in connectionMap) {
      if (!Object.prototype.hasOwnProperty.call(connectionMap, id)) {
        continue;
      }
      const saveInfo = connectionMap[id];
      if (saveInfo) {
        const block = saveInfo['block'];
        if (block && block.isShadow()) {
          block.dispose();
        }
      }
    }

    // Move the button input to the end.
    this.moveInputBefore('DUMMY_INPUT', null);

    // Update the button states.
    this.buttonMinus.setEnabled(this.argumentids.length > 1);
  }
} as OperatorJoinMultipleBlock;

/**
 * Block for 'letter _ of _' operator.
 */
Blockly.Blocks['operator_letter_of'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_LETTEROF,
      args0: [
        {
          type: 'input_value',
          name: 'LETTER'
        },
        {
          type: 'input_value',
          name: 'STRING'
        }
      ],
      extensions: ['colours_operators', 'output_string']
    });
  }
};

/**
 * Block for string length operator.
 */
Blockly.Blocks['operator_length'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_LENGTH,
      args0: [
        {
          type: 'input_value',
          name: 'STRING'
        }
      ],
      extensions: ['colours_operators', 'output_string']
    });
  }
};

/**
 * Block for _ contains _ operator
 */
Blockly.Blocks['operator_contains'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_CONTAINS,
      args0: [
        {
          type: 'input_value',
          name: 'STRING1'
        },
        {
          type: 'input_value',
          name: 'STRING2'
        }
      ],
      extensions: ['colours_operators', 'output_boolean']
    });
  }
};

/**
 * Block for mod two numbers.
 */
Blockly.Blocks['operator_mod'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_MOD,
      args0: [
        {
          type: 'input_value',
          name: 'NUM1'
        },
        {
          type: 'input_value',
          name: 'NUM2'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for rounding a numbers.
 */
Blockly.Blocks['operator_round'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_ROUND,
      args0: [
        {
          type: 'input_value',
          name: 'NUM'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for 'advanced' math ops on a number.
 */
Blockly.Blocks['operator_mathop'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_MATHOP,
      args0: [
        {
          type: 'field_dropdown',
          name: 'OPERATOR',
          options: [
            [Blockly.Msg.OPERATORS_MATHOP_ABS, 'abs'],
            [Blockly.Msg.OPERATORS_MATHOP_FLOOR, 'floor'],
            [Blockly.Msg.OPERATORS_MATHOP_CEILING, 'ceiling'],
            [Blockly.Msg.OPERATORS_MATHOP_SQRT, 'sqrt'],
            [Blockly.Msg.OPERATORS_MATHOP_SIN, 'sin'],
            [Blockly.Msg.OPERATORS_MATHOP_COS, 'cos'],
            [Blockly.Msg.OPERATORS_MATHOP_TAN, 'tan'],
            [Blockly.Msg.OPERATORS_MATHOP_ASIN, 'asin'],
            [Blockly.Msg.OPERATORS_MATHOP_ACOS, 'acos'],
            [Blockly.Msg.OPERATORS_MATHOP_ATAN, 'atan'],
            [Blockly.Msg.OPERATORS_MATHOP_LN, 'ln'],
            [Blockly.Msg.OPERATORS_MATHOP_LOG, 'log'],
            [Blockly.Msg.OPERATORS_MATHOP_EEXP, 'e ^'],
            [Blockly.Msg.OPERATORS_MATHOP_10EXP, '10 ^']
          ]
        },
        {
          type: 'input_value',
          name: 'NUM'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for getting power of two numbers.
 */
Blockly.Blocks['operator_power'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_POWER,
      args0: [
        {
          type: 'input_value',
          name: 'NUM1'
        },
        {
          type: 'input_value',
          name: 'NUM2'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for bit-and two numbers.
 */
Blockly.Blocks['operator_bitand'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_BITAND,
      args0: [
        {
          type: 'input_value',
          name: 'NUM1'
        },
        {
          type: 'input_value',
          name: 'NUM2'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for bit-or two numbers.
 */
Blockly.Blocks['operator_bitor'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_BITOR,
      args0: [
        {
          type: 'input_value',
          name: 'NUM1'
        },
        {
          type: 'input_value',
          name: 'NUM2'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for bit-xor two numbers.
 */
Blockly.Blocks['operator_bitxor'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_BITXOR,
      args0: [
        {
          type: 'input_value',
          name: 'NUM1'
        },
        {
          type: 'input_value',
          name: 'NUM2'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for dividing bit-not numbers.
 */
Blockly.Blocks['operator_bitnot'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_BITNOT,
      args0: [
        {
          type: 'input_value',
          name: 'NUM1'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for left shifting a number.
 */
Blockly.Blocks['operator_bitlsh'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_BITLSH,
      args0: [
        {
          type: 'input_value',
          name: 'NUM1'
        },
        {
          type: 'input_value',
          name: 'NUM2'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for right shifting a number.
 */
Blockly.Blocks['operator_bitrsh'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_BITRSH,
      args0: [
        {
          type: 'input_value',
          name: 'NUM1'
        },
        {
          type: 'input_value',
          name: 'NUM2'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for right shifting a number.
 */
Blockly.Blocks['operator_bitursh'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_BITURSH,
      args0: [
        {
          type: 'input_value',
          name: 'NUM1'
        },
        {
          type: 'input_value',
          name: 'NUM2'
        }
      ],
      extensions: ['colours_operators', 'output_number']
    });
  }
};

/**
 * Block for greater than or equal to comparator.
 */
Blockly.Blocks['operator_ge'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_GE,
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND1'
        },
        {
          type: 'input_value',
          name: 'OPERAND2'
        }
      ],
      extensions: ['colours_operators', 'output_boolean']
    });
  }
};

/**
 * Block for greater than or equal to comparator.
 */
Blockly.Blocks['operator_le'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_LE,
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND1'
        },
        {
          type: 'input_value',
          name: 'OPERAND2'
        }
      ],
      extensions: ['colours_operators', 'output_boolean']
    });
  }
};

/**
 * Block for unequal to comparator.
 */
Blockly.Blocks['operator_nequals'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_NEQUALS,
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND1'
        },
        {
          type: 'input_value',
          name: 'OPERAND2'
        }
      ],
      extensions: ['colours_operators', 'output_boolean']
    });
  }
};

/**
 * Block for get the index of substring.
 */
Blockly.Blocks['operator_indexof'] = {
  init: function(this: Blockly.Block) {
    this.jsonInit({
      message0: Blockly.Msg.OPERATORS_INDEXOF,
      args0: [
        {
          type: 'input_value',
          name: 'POS'
        },
        {
          type: 'input_value',
          name: 'STRING'
        },
        {
          type: 'input_value',
          name: 'SUBSTRING'
        }
      ],
      extensions: ['colours_operators', 'output_string']
    });
  }
};
