const Cast = require('../util/cast');

class Scratch3DataBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            data_variable: this.getVariable,
            data_setvariableto: this.setVariableTo,
            data_changevariableby: this.changeVariableBy,
            data_hidevariable: this.hideVariable,
            data_showvariable: this.showVariable,
            data_listcontents: this.getListContents,
            data_addtolist: this.addToList,
            data_deleteoflist: this.deleteOfList,
            data_deletealloflist: this.deleteAllOfList,
            data_insertatlist: this.insertAtList,
            data_replaceitemoflist: this.replaceItemOfList,
            data_itemoflist: this.getItemOfList,
            data_itemnumoflist: this.getItemNumOfList,
            data_lengthoflist: this.lengthOfList,
            data_listcontainsitem: this.listContainsItem,
            data_hidelist: this.hideList,
            data_showlist: this.showList
        };
    }

    getGenerators () {
        return {
            data_variable: this.ggetVariable,
            data_setvariableto: this.gsetVariableTo,
            data_changevariableby: this.gchangeVariableBy,
            data_hidevariable: this.ghideVariable,
            data_showvariable: this.gshowVariable,
            data_listcontents: this.ggetListContents,
            data_addtolist: this.gaddToList,
            data_deleteoflist: this.gdeleteOfList,
            data_deletealloflist: this.gdeleteAllOfList,
            data_insertatlist: this.ginsertAtList,
            data_replaceitemoflist: this.greplaceItemOfList,
            data_itemoflist: this.ggetItemOfList,
            data_itemnumoflist: this.ggetItemNumOfList,
            data_lengthoflist: this.glengthOfList,
            data_listcontainsitem: this.glistContainsItem,
            data_hidelist: this.ghideList,
            data_showlist: this.gshowList
        };
    }

    getVariable (args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.VARIABLE.id, args.VARIABLE.name);
        return variable.value;
    }

    ggetVariable (args, ctx) {
        const {id, name} = JSON.parse(args.VARIABLE.source);
        return {
            constant: false,
            type: 99 /* UNKNOWN */,
            result: `${ctx.getVariable(id, name)}.value`
        };
    }

    setVariableTo (args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.VARIABLE.id, args.VARIABLE.name);
        variable.value = args.VALUE;

        if (variable.isCloud) {
            util.ioQuery('cloud', 'requestUpdateVariable', [variable.name, args.VALUE]);
        }
    }

    gsetVariableTo (args, ctx) {
        const {id, name} = JSON.parse(args.VARIABLE.source);
        ctx.code += `${ctx.getVariable(id, name)}.value = ${args.VALUE.asUnknown()};\n`;
        ctx.code += `if (${ctx.getVariable(id, name)}.isCloud) {\n`;
        ctx.code += `util.ioQuery('cloud', 'requestUpdateVariable', ['${name}', ${args.VALUE.asUnknown()}]);\n`;
        ctx.code += `}\n`;
    }

    changeVariableBy (args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.VARIABLE.id, args.VARIABLE.name);
        const castedValue = Cast.toNumber(variable.value);
        const dValue = Cast.toNumber(args.VALUE);
        const newValue = castedValue + dValue;
        variable.value = newValue;

        if (variable.isCloud) {
            util.ioQuery('cloud', 'requestUpdateVariable', [variable.name, newValue]);
        }
    }

    gchangeVariableBy (args, ctx) {
        const {id, name} = JSON.parse(args.VARIABLE.source);
        ctx.code += `${ctx.getVariable(id, name)}.value = Cast.toNumber(${ctx.getVariable(id, name)}.value) + ${args.VALUE.asNumber()};\n`;
        ctx.code += `if (${ctx.getVariable(id, name)}.isCloud) {\n`;
        ctx.code += `util.ioQuery('cloud', 'requestUpdateVariable', ['${name}', ${args.VALUE.asUnknown()}]);\n`;
        ctx.code += `}\n`;
    }

    changeMonitorVisibility (id, visible) {
        // Send the monitor blocks an event like the flyout checkbox event.
        // This both updates the monitor state and changes the isMonitored block flag.
        this.runtime.monitorBlocks.changeBlock({
            id: id, // Monitor blocks for variables are the variable ID.
            element: 'checkbox', // Mimic checkbox event from flyout.
            value: visible
        }, this.runtime);
    }

    showVariable (args) {
        this.changeMonitorVisibility(args.VARIABLE.id, true);
    }

    gshowVariable (args, ctx) {
        const {id} = JSON.parse(args.VARIABLE.source);
        ctx.code += `runtime._packageObjects['scratch3_data'].changeMonitorVisibility("${id}", true);\n`;
    }

    hideVariable (args) {
        this.changeMonitorVisibility(args.VARIABLE.id, false);
    }

    ghideVariable (args, ctx) {
        const {id} = JSON.parse(args.VARIABLE.source);
        ctx.code += `runtime._packageObjects['scratch3_data'].changeMonitorVisibility("${id}", false);\n`;
    }

    showList (args) {
        this.changeMonitorVisibility(args.LIST.id, true);
    }

    gshowList (args, ctx) {
        const {id} = JSON.parse(args.LIST.source);
        ctx.code += `runtime._packageObjects['scratch3_data'].changeMonitorVisibility("${id}", true);\n`;
    }

    hideList (args) {
        this.changeMonitorVisibility(args.LIST.id, false);
    }

    ghideList (args, ctx) {
        const {id} = JSON.parse(args.LIST.source);
        ctx.code += `runtime._packageObjects['scratch3_data'].changeMonitorVisibility("${id}", false);\n`;
    }

    _getListContents (list, util) {
        // If block is running for monitors, return copy of list as an array if changed.
        if (util.thread.updateMonitor) {
            // Return original list value if up-to-date, which doesn't trigger monitor update.
            if (list._monitorUpToDate) return list.value;
            // If value changed, reset the flag and return a copy to trigger monitor update.
            // Because monitors use Immutable data structures, only new objects trigger updates.
            list._monitorUpToDate = true;
            return list.value.slice();
        }

        // Determine if the list is all single letters.
        // If it is, report contents joined together with no separator.
        // If it's not, report contents joined together with a space.
        let allSingleLetters = true;
        for (let i = 0; i < list.value.length; i++) {
            const listItem = list.value[i];
            if (!((typeof listItem === 'string') &&
                  (listItem.length === 1))) {
                allSingleLetters = false;
                break;
            }
        }
        if (allSingleLetters) {
            return list.value.join('');
        }
        return list.value.join(' ');
    }

    getListContents (args, util) {
        const list = util.target.lookupOrCreateList(args.LIST.id, args.LIST.name);
        return this._getListContents(list, util);
    }

    ggetListContents (args, ctx) {
        const {id, name} = JSON.parse(args.LIST.source);
        return {
            constant: false,
            type: 3 /** STRING **/,
            result: `runtime._packageObjects['scratch3_data']._getListContents(${ctx.getList(id, name)}, util)`
        };
    }

    _addToList (list, item, target) {
        if (list.value.length < Scratch3DataBlocks.LIST_ITEM_LIMIT) {
            list.value.push(item);
            list._monitorUpToDate = false;
        }
    }

    addToList (args, util) {
        const list = util.target.lookupOrCreateList(args.LIST.id, args.LIST.name);
        this._addToList(list, args.ITEM, util.target);
    }

    gaddToList (args, ctx) {
        const {id, name} = JSON.parse(args.LIST.source);
        ctx.code += `runtime._packageObjects['scratch3_data']._addToList(${ctx.getList(id, name)}, ${args.ITEM.asUnknown()}, target);\n`;
    }

    deleteOfList (args, util) {
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        const index = Cast.toListIndex(args.INDEX, list.value.length, true);
        if (index === Cast.LIST_INVALID) {
            return;
        } else if (index === Cast.LIST_ALL) {
            list.value = [];
            return;
        }
        list.value.splice(index - 1, 1);
        list._monitorUpToDate = false;
    }

    gdeleteOfList (args, ctx) {
        const index = ctx.currentScope.counter.next();
        const {id, name} = JSON.parse(args.LIST.source);
        ctx.code += `const ${index} = Cast.toListIndex(${args.INDEX.asNumber()}, ${ctx.getList(id, name)}.value.length, true);\n`;
        ctx.code += `if (${index} === Cast.LIST_INVALID) return;\n`;
        ctx.code += `else if (${index} === Cast.LIST_ALL) {\n`;
        ctx.code += `${ctx.getList(id, name)}.value = [];\n`;
        ctx.code += `return;\n`;
        ctx.code += `}\n`;
        ctx.code += `${ctx.getList(id, name)}.value.splice(${index} - 1, 1);\n`;
        ctx.code += `${ctx.getList(id, name)}._monitorUpToDate = false;\n`;
    }

    deleteAllOfList (args, util) {
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        list.value = [];
        return;
    }

    gdeleteAllOfList (args, ctx) {
        const {id, name} = JSON.parse(args.LIST.source);
        ctx.code += `${ctx.getList(id, name)}.value = [];\n`;
    }

    _insertAtList (list, index, item) {
        index = Cast.toListIndex(index, list.value.length + 1, false);
        if (index === Cast.LIST_INVALID) {
            return;
        }
        const listLimit = Scratch3DataBlocks.LIST_ITEM_LIMIT;
        if (index > listLimit) return;
        list.value.splice(index - 1, 0, item);
        if (list.value.length > listLimit) {
            // If inserting caused the list to grow larger than the limit,
            // remove the last element in the list
            list.value.pop();
        }
        list._monitorUpToDate = false;
    }

    insertAtList (args, util) {
        const list = util.target.lookupOrCreateList(args.LIST.id, args.LIST.name);
        this._insertAtList(list, args.INDEX, args.ITEM, util.target);
    }

    ginsertAtList (args, ctx) {
        const {id, name} = JSON.parse(args.LIST.source);
        ctx.code += `runtime._packageObjects['scratch3_data']._insertAtList(${ctx.getList(id, name)}, ${args.INDEX.asNumber()}, ${args.ITEM.asUnknown()}, target);\n`;
    }

    replaceItemOfList (args, util) {
        const item = args.ITEM;
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        const index = Cast.toListIndex(args.INDEX, list.value.length, false);
        if (index === Cast.LIST_INVALID) {
            return;
        }
        list.value[index - 1] = item;
        list._monitorUpToDate = false;
    }

    greplaceItemOfList (args, ctx) {
        const {id, name} = JSON.parse(args.LIST.source);
        const index = ctx.currentScope.counter.next();
        ctx.code += `const ${index} = Cast.toListIndex(${args.INDEX.asNumber()}, ${ctx.getList(id, name)}.value.length, true);\n`;
        ctx.code += `if (${index} === Cast.LIST_INVALID) return;\n`;
        ctx.code += `${ctx.getList(id, name)}.value.[${index} - 1] = ${args.ITEM.asUnknown()};\n`;
        ctx.code += `${ctx.getList(id, name)}._monitorUpToDate = false;\n`;
    }

    _getItemOfList (list, index) {
        index = Cast.toListIndex(index, list.value.length, false);
        if (index === Cast.LIST_INVALID) {
            return '';
        }
        return list.value[index - 1];
    }

    getItemOfList (args, util) {
        const list = util.target.lookupOrCreateList(args.LIST.id, args.LIST.name);
        return this._getItemOfList(list, args.INDEX, util.target);
    }

    ggetItemOfList (args, ctx) {
        const {id, name} = JSON.parse(args.LIST.source);
        return {
            constant: false,
            type: 99 /* UNKNOWN */,
            result: `runtime._packageObjects['scratch3_data']._getItemOfList(${ctx.getList(id, name)}, ${args.INDEX.asNumber()}, target)`
        }
    }

    _getItemNumOfList (list, item) {
        // Go through the list items one-by-one using Cast.compare. This is for
        // cases like checking if 123 is contained in a list [4, 7, '123'] --
        // Scratch considers 123 and '123' to be equal.
        for (let i = 0; i < list.value.length; i++) {
            if (Cast.compare(list.value[i], item) === 0) {
                return i + 1;
            }
        }

        // We don't bother using .indexOf() at all, because it would end up with
        // edge cases such as the index of '123' in [4, 7, 123, '123', 9].
        // If we use indexOf(), this block would return 4 instead of 3, because
        // indexOf() sees the first occurence of the string 123 as the fourth
        // item in the list. With Scratch, this would be confusing -- after all,
        // '123' and 123 look the same, so one would expect the block to say
        // that the first occurrence of '123' (or 123) to be the third item.

        // Default to 0 if there's no match. Since Scratch lists are 1-indexed,
        // we don't have to worry about this conflicting with the "this item is
        // the first value" number (in JS that is 0, but in Scratch it's 1).
        return 0;
    }

    getItemNumOfList (args, util) {
        const list = util.target.lookupOrCreateList(args.LIST.id, args.LIST.name);
        return this._getItemNumOfList(list, args.ITEM, util.target);
    }

    ggetItemNumOfList (args, util) {
        const {id, name} = JSON.parse(args.LIST.source);
        return {
            constant: false,
            type: 1 /* NUMBER */,
            result: `runtime._packageObjects['scratch3_data']._getItemOfList(${ctx.getList(id, name)}, ${args.ITEM.asUnknown()})`
        };
    }

    lengthOfList (args, util) {
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        return list.value.length;
    }

    glengthOfList (args, ctx) {
        const {id, name} = JSON.parse(args.LIST.source);
        return {
            constant: false,
            type: 1 /* NUMBER */,
            result: `${ctx.getList(id, name)}.value.length`
        };
    }

    _listContainsItem (list, item) {
        if (list.value.indexOf(item) >= 0) {
            return true;
        }
        // Try using Scratch comparison operator on each item.
        // (Scratch considers the string '123' equal to the number 123).
        for (let i = 0; i < list.value.length; i++) {
            if (Cast.compare(list.value[i], item) === 0) {
                return true;
            }
        }
        return false;
    }

    listContainsItem (args, util) {
        const list = util.target.lookupOrCreateList(args.LIST.id, args.LIST.name);
        return this._listContainsItem(list, args.ITEM);
    }

    glistContainsItem (args, ctx) {
        const {id, name} = JSON.parse(args.LIST.source);
        return {
            constant: false,
            type: 4 /* BOOLEAN */,
            result: `runtime._packageObjects['scratch3_data']._listContainsItem(${ctx.getList(id, name)}, ${args.ITEM.asUnknown()})`
        };
    }

    /**
     * Type representation for list variables.
     * @const {number}
     */
    static get LIST_ITEM_LIMIT () {
        return 200000;
    }
}

module.exports = Scratch3DataBlocks;
