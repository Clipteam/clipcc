import OpcodeLabels from './opcode-labels.js';

const isUndefined = a => typeof a === 'undefined';

/**
 * @import * as VirtualMachine from 'clipcc-vm';
 */

/**
 * Convert monitors from VM format to what the GUI needs to render.
 * - Convert opcode to a label and a category
 * @param {object} root0 - The monitor block in VM format
 * @param {string} root0.id - The id of the monitor block
 * @param {string} root0.spriteName - Present only if the monitor applies only to the sprite
 *     with given target ID. The name of the target sprite when the monitor was created
 * @param {string} root0.opcode - The opcode of the monitor
 * @param {object} root0.params - Extra params to the monitor block
 * @param {string|number|Array} root0.value - The monitor value
 * @param {VirtualMachine} root0.vm - The VM instance, used to get labels for extension monitors
 * @returns {object} The adapted monitor with label and category
 */
export default function ({id, spriteName, opcode, params, value, vm}) {
    // Extension monitors get their labels from the Runtime through `getLabelForOpcode`.
    // Other monitors' labels are hard-coded in `OpcodeLabels`.
    let {label, category, labelFn} = (vm && vm.runtime.getLabelForOpcode(opcode)) || OpcodeLabels.getLabel(opcode);

    // Use labelFn if provided for dynamic labelling (e.g. variables)
    if (!isUndefined(labelFn)) label = labelFn(params);

    // Append sprite name for sprite-specific monitors
    if (spriteName) {
        label = `${spriteName}: ${label}`;
    }

    // If value is a number, round it to six decimal places
    if (typeof value === 'number') {
        value = Number(value.toFixed(6));
    }

    // Turn the value to a string, for handle boolean values
    if (typeof value === 'boolean') {
        value = value.toString();
    }

    // Lists can contain booleans, which should also be turned to strings
    if (Array.isArray(value)) {
        value = value.map(item => item.toString());
    }

    return {id, label, category, value};
}
