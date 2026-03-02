/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Massachusetts Institute of Technology
 * All rights reserved.
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
 * @fileoverview Text input field with floating "remove" button.
 * @author pkaplan@media.mit.edu (Paul Kaplan)
 */

import * as Blockly from 'blockly/core';
import {ProcedureDeclarationBlock} from '../blocks/procedures';
import styles from '../styles/textinput_removable.css';

/**
 * Class for an editable text field displaying a deletion icon when selected.
 */
export class FieldTextInputRemovable extends Blockly.FieldTextInput {
  private removeButtonMouseWrapper: Blockly.browserEvents.Data | null = null;

  /**
   * @param value The initial content of the field.
   * @param validator An optional function that is called
   *     to validate any constraints on what the user entered.  Takes the new
   *     text as an argument and returns either the accepted text, a replacement
   *     text, or null to abort the change.
   * @param config A map of options used to configure the field.
   */
  constructor(
    value?: string | typeof Blockly.Field.SKIP_SETUP,
    validator?: Blockly.FieldTextInputValidator | null,
    config?: Blockly.FieldTextInputConfig
  ) {
    super(value, validator, config);
  }

  /**
   * Helper function to construct a FieldTextInputRemovable from a JSON arg object,
   * dereferencing any string table references.
   * @param options A JSON object with options (text, class, and spellcheck).
   * @returns The new text input.
   */
  static override fromJson(options: Blockly.FieldTextInputFromJsonConfig): Blockly.FieldTextInput {
    const text = Blockly.utils.parsing.replaceMessageReferences(options.text);
    const field = new FieldTextInputRemovable(text, null, options);
    if (typeof options.spellcheck == 'boolean') {
      field.setSpellcheck(options.spellcheck);
    }
    return field;
  }

  override dispose(): void {
    super.dispose();
    if (this.removeButtonMouseWrapper) {
      Blockly.browserEvents.unbind(this.removeButtonMouseWrapper);
    }
  }

  /**
   * Show the inline free-text editor on top of the text with the remove button.
   * @param event Optional mouse event that triggered the field to open, or
   *     undefined if triggered programmatically.
   * @param quietInput True if editor should be created without focus.
   *     Defaults to false.
   */
  protected override showEditor_(event?: Event, quietInput?: boolean): void {
    super.showEditor_(event, quietInput);
    const div = Blockly.WidgetDiv.getDiv();
    if (!div) {
      return;
    }
    div.className += ' removableTextInput';
    const removeButton = document.createElement('img');
    removeButton.className = 'blocklyTextRemoveIcon';
    removeButton.setAttribute(
      'src',
      Blockly.getMainWorkspace().options.pathToMedia + 'icons/remove.svg'
    );
    this.removeButtonMouseWrapper = Blockly.browserEvents.bind(
      removeButton, 'mousedown', this, this.removeCallback
    );
    div.appendChild(removeButton);
  }

  /**
   * Function to call when remove button is called. Checks for removeFieldCallback
   * on sourceBlock and calls it if possible.
   */
  private removeCallback() {
    const sourceBlock = this.getSourceBlock() as ProcedureDeclarationBlock | null;
    if (sourceBlock && 'removeFieldCallback' in sourceBlock) {
      sourceBlock.removeFieldCallback(this);
    } else {
      console.warn('Expected a source block with removeFieldCallback');
    }
  }
}

/**
 * Register the field and any dependencies.
 */
export function registerFieldTextInputRemovable() {
  Blockly.fieldRegistry.register('field_input_removable', FieldTextInputRemovable);
  Blockly.Css.register(styles);
}
