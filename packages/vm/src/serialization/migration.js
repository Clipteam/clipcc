/**
 * @fileoverview
 * Migration from legacy ClipCC.
 */
import log from '../util/log';

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

/**
 * Migrate the mutation of block between ClipCC runtime format and SB3 format.
 * @param {object} block The block to be migrated. Nothing happens if the block is not target.
 * @param {[boolean]} backward True if you want migrate from ClipCC runtime format to SB3 format.
 * @returns {object} The migrated mutation. Deep copied if backward param is true mutation actual changed.
 */
const migrateMutation = (block, backward) => {
    let mutation = block.mutation;
    if (!mutation) {
        return mutation;
    }

    switch (block.opcode) {
    case 'procedures_call':
    case 'procedures_call_return': // mutation migration happens before block migration
    case 'procedures_prototype':
    case 'procedures_prototype_return':
        if (backward) {
            // procedures block's mutation don't have nested structure, it's safe to use spread operator here.
            mutation = {...mutation};
            for (const key in mutation) {
                switch (key) {
                // proccode is already a string, just keep it as is
                // It's expected bool fields to be actual bool (see parser), since JSON.parse is safe to use.
                case 'argumentids':
                case 'argumentnames':
                case 'argumentdefaults':
                    // Expect mutation[key] to be an array in runtime.
                    mutation[key] = JSON.stringify(mutation[key]);
                    break;
                }
                // in other cases, just keep the value as is,
                // or provide a hook for extension blocks later.
            }

            if (!Object.hasOwnProperty.call(mutation, 'tagName')) {
                mutation.tagName = 'mutation';
            }
            if (!Object.hasOwnProperty.call(mutation, 'children')) {
                mutation.children = [];
            }
        } else {
            for (const key in mutation) {
                switch (key) {
                case 'warp':
                case 'global':
                case 'return':
                case 'generateshadows':
                    // Expect mutation[key] to be a string.
                    mutation[key] = (mutation[key] === 'true');
                    break;
                case 'argumentids':
                case 'argumentnames':
                case 'argumentdefaults':
                    // Expect mutation[key] to be a JSON string representing an array.
                    try {
                        mutation[key] = JSON.parse(mutation[key]);
                    } catch {
                        log.error(`Error parsing mutation property ${key}: ${mutation[key]}`);
                        mutation[key] = [];
                    }
                    break;
                }
            }
            // vm still expects tagName and children to be exists (see mutationToXML).
            // just don't touch them.
        }
        break;
    }
    return mutation;
};


export {
    migrationMap,
    mergeDeep,
    migrateMutation
};
