const IRGenerator = require('./ir-generator');
const JSGenerator = require('./js-generator');
const Cast = require('../util/cast');

/** @import Thread from '../engine/thread.js' */

/**
 * Compile an existing thread to executable object.
 * @param {Thread} thread thread to compile
 * @return {?Generator} compiled result, null if failed
 */
const compile = function (thread) {
    try {
        const irGenerator = new IRGenerator(thread);
        const ir = irGenerator.generateScript(thread.topBlock);
        console.log(ir);

        const jsGenerator = new JSGenerator();
        const fn = jsGenerator.compileForThread(ir).call(globalThis);

        console.log(fn.toString());

        thread.compileResult = fn.call({Cast}, thread)();
    } catch (e) {
        console.error(e);
        thread.compileResult = null;
    }
    return thread.compileResult;
};

module.exports = compile;
