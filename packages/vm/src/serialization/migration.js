/**
 * @fileoverview
 * Migration from legacy ClipCC.
 */

const migrationMap = {
    procedures_definition_return: {
        opcode: 'procedures_definition'
    },
    procedures_prototype_return: {
        opcode: 'procedures_prototype',
        mutation: {
            return: true
        }
    },
    procedures_call_return: {
        opcode: 'procedures_call',
        mutation: {
            return: true
        }
    }
};

const mergeDeep = (target, ...sources) => {
    if (!sources.length) return target;
    const source = sources.shift();

    if (typeof target !== 'object' || target === null) {
        return source;
    }

    if (typeof source !== 'object' || source === null) {
        return target;
    }

    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (Object.prototype.hasOwnProperty.call(target, key)) {
                if (Array.isArray(target[key]) && Array.isArray(source[key])) {
                    target[key] = mergeDeep(target[key], ...source[key]);
                } else if (typeof target[key] === 'object' && typeof source[key] === 'object') {
                    target[key] = mergeDeep(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            } else {
                target[key] = source[key];
            }
        }
    }

    return mergeDeep(target, ...sources);
};


module.exports = {
    migrationMap,
    mergeDeep
};
