import type Target from '../engine/target';
import type {VariableType} from '../engine/variable';
import type {VMField} from '../serialization/schema';

type VarRefMap = Record<string, string[]>;

export interface VarReference {
    referencingField: VMField;
    type: VariableType;
}

class VariableUtil {
    static _mergeVarRefObjects (accum: VarRefMap, obj2: VarRefMap): VarRefMap {
        for (const id in obj2) {
            if (accum[id]) {
                accum[id] = accum[id].concat(obj2[id]);
            } else {
                accum[id] = obj2[id];
            }
        }
        return accum;
    }

    /**
     * Get all variable/list references in the given list of targets
     * in the project.
     * @param targets The list of targets to get the variable
     * and list references from.
     * @param shouldIncludeBroadcast Whether to include broadcast message fields.
     * @returns An object with variable ids as the keys and a list of block fields referencing
     * the variable.
     */
    static getAllVarRefsForTargets (targets: Target[], shouldIncludeBroadcast: boolean): VarRefMap {
        return targets
            .map(t => t.blocks.getAllVariableAndListReferences(null, shouldIncludeBroadcast))
            .reduce(VariableUtil._mergeVarRefObjects, {});
    }

    /**
     * Give all variable references provided a new id and possibly new name.
     * @param referencesToUpdate Context of the change, the object containing variable
     * references to update.
     * @param newId ID of the variable that the old references should be replaced with
     * @param optNewName New variable name to merge with. The old
     * variable name in the references being updated should be replaced with this new name.
     * If this parameter is not provided or is '', no name change occurs.
     */
    static updateVariableIdentifiers (referencesToUpdate: VarReference[], newId: string, optNewName?: string) {
        referencesToUpdate.map(ref => {
            ref.referencingField.id = newId;
            if (optNewName) {
                ref.referencingField.value = optNewName;
            }
            return ref;
        });
    }
}

export default VariableUtil;
