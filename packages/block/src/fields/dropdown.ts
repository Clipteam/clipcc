/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * A dropdown field that preserves values which are not in its current options.
 * Dynamic dropdowns can omit a value that is still valid in the VM, such as a
 * sprite target omitted from the current sprite's menu.
 */
export class FieldDropdown extends Blockly.FieldDropdown {
  /**
   * Accept string values even when the current menu does not contain them.
   * @param newValue The value to validate.
   * @returns The string value, or null for non-string values.
   */
  protected override doClassValidation_(newValue?: string): string | null {
    return typeof newValue === 'string' ? newValue : null;
  }

  /**
   * Display an unmatched value while retaining Blockly's normal rendering for
   * matched text, image, and HTMLElement options.
   * @returns Text to display for the current value.
   */
  protected override getText_(): string | null {
    const value = this.getValue();
    if (value === null) {
      return super.getText_();
    }

    for (const option of this.getOptions(true)) {
      if (option !== 'separator' && option[1] === value) {
        return super.getText_();
      }
    }

    return value;
  }
}

/**
 * Replaces Blockly's field_dropdown registration with the preserving field.
 */
export function registerFieldDropdown() {
  Blockly.fieldRegistry.unregister('field_dropdown');
  Blockly.fieldRegistry.register('field_dropdown', FieldDropdown);
}
