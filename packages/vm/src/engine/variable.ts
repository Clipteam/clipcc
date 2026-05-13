/**
 * @fileoverview
 * Object representing a Scratch variable.
 */

import uid from '../util/uid';

import xmlEscape from '../util/xml-escape';

export const enum VariableType {
    SCALAR = '',
    LIST = 'list',
    BROADCAST_MESSAGE = 'broadcast_msg'
}

import type * as ClipCCBlocks from 'clipcc-block';

class Variable {
    /**
     * Id of the variable.
     */
    id: string;
    /**
     * Name of the variable.
     */
    name: string;
    /**
     * Type of the variable.
     */
    type: VariableType;
    /**
     * Whether the variable is stored in the cloud.
     */
    isCloud: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;

    constructor (id: string | null, name: string, type: VariableType, isCloud = false) {
        this.id = id || uid();
        this.name = name;
        this.type = type;
        this.isCloud = isCloud;
        switch (this.type) {
        case Variable.SCALAR_TYPE:
            this.value = 0;
            break;
        case Variable.LIST_TYPE:
            this.value = [];
            break;
        case Variable.BROADCAST_MESSAGE_TYPE:
            this.value = this.name;
            break;
        default:
            throw new Error(`Invalid variable type: ${this.type}`);
        }
    }

    toXML (isLocal: boolean): string {
        isLocal = (isLocal === true);
        return `<variable type="${this.type}" id="${this.id}" islocal="${isLocal
        }" iscloud="${this.isCloud}">${xmlEscape(this.name)}</variable>`;
    }

    /**
     * Serializes this VariableModel to JSON State.
     * @param isLocal Whether this variable is locally scoped.
     * @returns a JSON representation of this VariableModel.
     */
    toState (isLocal: boolean): ClipCCBlocks.variableModel.ScratchVariableState {
        isLocal = (isLocal === true);
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            isLocal,
            isCloud: this.isCloud
        };
    }

    static get SCALAR_TYPE () {
        return VariableType.SCALAR;
    }

    static get LIST_TYPE () {
        return VariableType.LIST;
    }

    static get BROADCAST_MESSAGE_TYPE () {
        return VariableType.BROADCAST_MESSAGE;
    }
}

export default Variable;
