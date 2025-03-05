/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2017 Google Inc.
 * https://developers.google.com/blockly/
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
 * @fileoverview Variable getter field.  Appears as a label but has a variable
 *     picker in the right-click menu.
 * @author fenichel@google.com (Rachel Fenichel)
 */

import * as Blockly from 'blockly/core';

/**
 * Class for a variable getter field.
 */
export class FieldVariableGetter extends Blockly.FieldLabel {
  /**
   * Editable fields usually show some sort of UI indicating they are
   * editable. They will also be saved by the serializer.
   */
  override EDITABLE = false;

  /**
   * Serializable fields are saved by the serializer, non-serializable fields
   * are not. Editable fields should also be serializable. This is not the
   * case by default so that SERIALIZABLE is backwards compatible.
   */
  override SERIALIZABLE = true;

  private variableName: string;
  private variableType: string;
  private variable: Blockly.IVariableModel<Blockly.IVariableState> | null = null;

  /**
   * @param name The name of variable.
   * @param type The type of variable this field is associated with.
   */
  constructor(name: string, type?: string) {
    super(Blockly.Field.SKIP_SETUP);

    this.variableName = name;
    this.variableType = type ?? '';
  }

  /**
   * Construct a FieldVariableGetter from a JSON arg object,
   * dereferencing any string table references.
   * @param options A JSON object with options (variable,
   *                          variableTypes, and defaultType).
   * @returns The new field instance.
   */
  static override fromJson(options: FieldVariableFromJsonConfig): FieldVariableGetter {
    const varname = Blockly.utils.parsing.replaceMessageReferences(options.text);
    return new FieldVariableGetter(varname, options.variableType);
  }

  /**
   * Sets the field's value based on the given XML element. Should only be
   * called by Blockly.Xml.
   * @param fieldElement The element containing info about the field's state.
   */
  override fromXml(fieldElement: Element): void {
    this.variableName = fieldElement.textContent ?? '';
    this.variableType = fieldElement.getAttribute('variabletype') ?? '';
    this.setValue(fieldElement.getAttribute('id'));
  }

  /**
   * Serializes this field's value to XML. Should only be called by Blockly.Xml.
   * @param fieldElement The element to populate with info about the field's
   *     state.
   * @returns The element containing info about the field's state.
   */
  override toXml(fieldElement: Element): Element {
    fieldElement.setAttribute('id', this.variable!.getId());
    fieldElement.setAttribute('variabletype', this.variable!.getType());
    fieldElement.textContent = this.variable!.getName();
    return fieldElement;
  }

  /**
   * Initializes the model of the field after it has been installed on a block.
   */
  override initModel(): void {
    const block = this.getSourceBlock();
    if (!block) {
      throw new Blockly.UnattachedFieldError();
    }
    if (this.variable) {
      return; // Initialization already happened.
    }
    const variable = Blockly.Variables.getOrCreateVariablePackage(
      block.workspace,
      null,
      this.variableName,
      this.variableType
    );
    // Don't call setValue because we don't want to cause a rerender.
    this.doValueUpdate_(variable.getId());
  }

  /**
   * Get the variable's ID.
   * @returns Current variable's ID.
   */
  override getValue(): string {
    return this.variable ? this.variable.getId() : '';
  }

  /**
   * Get the text from this field.
   * @returns Current text.
   */
  override getText(): string {
    return this.variable ? this.variable.getName() : '';
  }

  /**
   * Get the variable model for the variable associated with this field.
   * Not guaranteed to be in the variable map on the workspace (e.g. if accessed
   * after the variable has been deleted).
   * @returns the selected variable, or null if none was selected.
   */
  getVariable(): Blockly.IVariableModel<Blockly.IVariableState> | null {
    return this.variable;
  }

  /**
   * Used to change the variable of this field.
   * @param newValue New variable id.
   */
  protected override doValueUpdate_(newValue: string): void {
    // What do I do when id is null?  That happens when undoing a change event
    // for the first time the value was set.
    const workspace = this.getSourceBlock()!.workspace;
    const variable = Blockly.Variables.getVariable(workspace, newValue);

    if (!variable) {
      throw new Error(`Variable id doesn't point to a real variable!  ID was ${newValue}`);
    }

    super.doValueUpdate_(newValue);
    this.variable = variable;
  }

  /**
   * Whether this field references any Blockly variables.  If true it may need
   * to be handled differently during serialization and deserialization.
   * Subclasses may override this.
   * @returns True if this field has any variable references.
   */
  override referencesVariables(): boolean {
    return true;
  }

  /**
   * Refresh the variable name referenced by this field if this field references
   * variables.
   */
  override refreshVariableName(): void {
    this.forceRerender();
  }
}

export interface FieldVariableFromJsonConfig extends Blockly.FieldLabelFromJsonConfig {
  name: string;
  variableType?: string;
}

/**
 * Register the field and any dependencies.
 */
export function registerFieldVariableGetter() {
  Blockly.fieldRegistry.register('field_variable_getter', FieldVariableGetter);
}
