/**
 * @import VirtualMachine from 'clipcc-vm';
 */

/**
 * Report a telemetry event.
 * @param {VirtualMachine} vm - the VM instance to collect metadata from
 * @param {string} projectName - the name of the project to include in the metadata
 * @param {string} locale - the locale to include in the metadata
 */

// TODO make a telemetry HOC and move this stuff there
const collectMetadata = function (vm, projectName = '', locale = '') {
    // TODO move most or all of this into a collectMetadata() method on the VM/Runtime
    const metadata = {
        projectName: projectName,
        language: locale,
        spriteCount: 0,
        blocksCount: 0,
        costumesCount: 0,
        listsCount: 0,
        scriptCount: 0,
        soundsCount: 0,
        variablesCount: 0
    };

    for (const target of vm.runtime.targets) {
        ++metadata.spriteCount;
        metadata.blocksCount += Object.keys(target.sprite.blocks._blocks).length;
        metadata.costumesCount += target.sprite.costumes_.length;
        metadata.scriptCount += target.sprite.blocks._scripts.length;
        metadata.soundsCount += target.sprite.sounds.length;
        for (const variableName in target.variables) {
            const variable = target.variables[variableName];
            if (variable.type === 'list') {
                ++metadata.listsCount;
            } else {
                ++metadata.variablesCount;
            }
        }
    }

    return metadata;
};

export default collectMetadata;
