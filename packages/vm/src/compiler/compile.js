const IRGenerator = require('./ir-generator');
const JSGenerator = require('./js-generator');

const compile = function (thread) {
    const irGenerator = new IRGenerator(thread);
    const ir = irGenerator.generateScript(thread.topBlock);
    console.log(ir);

    const jsGenerator = new JSGenerator();
    const js = jsGenerator.generateInstructionList(ir);
    console.log(js.code);

    return js;
};

module.exports = compile;
