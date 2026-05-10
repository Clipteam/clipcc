/**
 * @fileoverview
 * Object representing a Scratch variable.
 */

import uid from '../util/uid';

import xmlEscape from '../util/xml-escape';

class Variable {
    /**
     * @param {string} id Id of the variable.
     * @param {string} name Name of the variable.
     * @param {string} type Type of the variable, one of '' or 'list'
     * @param {boolean} isCloud Whether the variable is stored in the cloud.
     * @class
     */
    constructor (id, name, type, isCloud) {
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

    toXML (isLocal) {
        isLocal = (isLocal === true);
        return `<variable type="${this.type}" id="${this.id}" islocal="${isLocal
        }" iscloud="${this.isCloud}">${xmlEscape(this.name)}</variable>`;
    }

    /**
     * Serializes this VariableModel to JSON State.
     * @param {boolean} isLocal Whether this variable is locally scoped.
     * @returns {object} a JSON representation of this VariableModel.
     */
    toState (isLocal) {
        isLocal = (isLocal === true);
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            isLocal,
            isCloud: this.isCloud
        };
    }

    /**
     * Type representation for scalar variables.
     * This is currently represented as ''
     * for compatibility with blockly.
     * @returns {string}
     */
    static get SCALAR_TYPE () {
        return '';
    }

    /**
     * Type representation for list variables.
     * @returns {string}
     */
    static get LIST_TYPE () {
        return 'list';
    }

    /**
     * Type representation for list variables.
     * @returns {string}
     */
    static get BROADCAST_MESSAGE_TYPE () {
        return 'broadcast_msg';
    }
}

export default Variable;
