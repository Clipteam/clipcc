/**
 * @file Webpack loader for loading default message of clipcc-block.
 */

const fs = require('node:fs');
const path = require('node:path');

module.exports = function (/** @type {string} */ source) {
    if (!source.includes('export default')) return source;

    const messagePath = path.resolve(__dirname, '../../block/msg/messages.js');
    const content = fs.readFileSync(messagePath, {encoding: 'utf-8'});
    this.addDependency(messagePath);

    const code = `${source.replace('export default', 'const locale = ')}\n` +
        `const Blockly = {Msg: Object.create(null)};\n${content}\n` +
        `for (const lang in locale) locale[lang] = Object.assign({}, Blockly.Msg, locale[lang]);\n` +
        `export default locale;\n`;

    return code;
};
