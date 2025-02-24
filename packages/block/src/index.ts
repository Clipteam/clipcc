import * as Blockly from 'blockly';

export function inject(container: Element | string, options?: Blockly.BlocklyOptions) {
    const workspace = Blockly.inject(container, options);
    return workspace;
}
