import adapter, {type AdaptableEvents} from './adapter';
import xmlEscape from '../util/xml-escape';
import MonitorRecord from './monitor-record';
import Clone from '../util/clone';
import {Map} from 'immutable';
import log from '../util/log';
import Variable from './variable';
import getMonitorIdForBlockWithArgs from '../util/get-monitor-id';
import type Runtime from './runtime';
import type {ProcedureMutation, VMBlock, VMInput, VMMutation} from '../serialization/schema';
import type {RuntimeScriptCache} from './blocks-runtime-cache';
import type * as ClipCCBlock from 'clipcc-block';
import type {CachedBlockData, CacheType} from './blocks-execute-cache';
import type RenderedTarget from '../sprites/rendered-target';
import type Comment from './comment';

/**
 * @fileoverview
 * Store and mutate the VM block representation,
 * and handle updates from Scratch Blocks events.
 */

interface CacheState {
    /**
     * A cache of hat opcodes to collection of threads to execute
     */
    scripts: Record<string, RuntimeScriptCache[]>;
    /**
     * Cache block inputs by block id
     */
    inputs: Record<string, Record<string, VMInput>>;
    /**
     * Cache procedure Param Names by block id.
     * Tuple for [names, ids, defaults]
     */
    procedureParamNames: Record<string, [string[], string[], unknown[]] | null>;
    /**
     * Cache procedure definitions by block id
     */
    procedureDefinitions: Record<string, string | null>;
    /**
     * A cache for execute to use and store on by block id.
     */
    _executeCached: Record<string, CachedBlockData | CacheType>;
    /**
     * A cache of block IDs and targets to start threads on as they are
     * actively monitored.
     */
    _monitored: null | Array<{blockId: string, target: RenderedTarget | null | undefined}>;
}

type ListenableBlocklyEvents =
      ClipCCBlock.Events.BlockCreate
    | ClipCCBlock.Events.BlockChange
    | ClipCCBlock.Events.BlockMove
    | ClipCCBlock.BlockDragOutside
    | ClipCCBlock.BlockDragEnd
    | ClipCCBlock.Events.BlockDelete
    | ClipCCBlock.VarCreate
    | ClipCCBlock.Events.VarRename
    | ClipCCBlock.VarDelete
    | ClipCCBlock.BlockCommentCreate
    | ClipCCBlock.Events.CommentCreate
    | ClipCCBlock.Events.CommentChange
    | ClipCCBlock.BlockCommentMove
    | ClipCCBlock.Events.CommentMove
    | ClipCCBlock.BlockCommentCollapse
    | ClipCCBlock.Events.CommentCollapse
    | ClipCCBlock.BlockCommentResize
    | ClipCCBlock.Events.CommentResize
    | ClipCCBlock.BlockCommentDelete
    | ClipCCBlock.Events.CommentDelete
    | ClipCCBlock.FuncChange
    | ClipCCBlock.Events.Click;

/**
 * Create a fresh set of derived block caches.
 * Execute and runtime caches live under their own namespaces so they can be
 * managed by their own modules without relying on module side effects.
 * @returns Newly initialized cache state
 */
const createCacheState = function (): CacheState {
    return {
        inputs: {},
        procedureParamNames: {},
        procedureDefinitions: {},
        _executeCached: {},
        _monitored: null,
        scripts: {}
    };
};

/**
 * Create a block container.
 */
class Blocks {
    /**
     * All blocks in the workspace.
     * Keys are block IDs, values are metadata about the block.
     */
    _blocks: Record<string, VMBlock> = {};
    /**
     * All top-level scripts in the workspace.
     * A list of block IDs that represent scripts (i.e., first block in script).
     */
    _scripts: string[] = [];

    /**
     * Derived block caches invalidated together when block state changes.
     */
    _cache = createCacheState();
    constructor (
        /**
         * The runtime this block container operates within
         */
        public runtime: Runtime,
        /**
         * Flag which indicates that blocks in this container should not glow.
         * Blocks will still glow when clicked on, but this flag is used to control
         * whether the blocks in this container can request a glow as part of
         * a running stack. E.g. the flyout block container and the monitor block container
         * should not be able to request a glow, but blocks containers belonging to
         * sprites should.
         */
        public forceNoGlow = false
    ) {
        Object.defineProperty(this, '_cache', {writable: true, enumerable: false});
    }

    /**
     * Blockly inputs that represent statements/branch.
     * are prefixed with this string.
     */
    static get BRANCH_INPUT_PREFIX () {
        return 'SUBSTACK' as const;
    }

    /**
     * Provide an object with metadata for the requested block ID.
     * @param blockId ID of block we have stored.
     * @returns Metadata about the block, if it exists.
     */
    getBlock (blockId?: string | null) {
        return blockId ? this._blocks[blockId] : undefined;
    }

    /**
     * Get all known top-level blocks that start scripts.
     */
    getScripts () {
        return this._scripts;
    }

    /**
     * Get the next block for a particular block
     * @param id ID of block to get the next block for
     * @returns ID of next block in the sequence
     */
    getNextBlock (id: string | null) {
        if (!id) return null;
        const block = this._blocks[id];
        return (typeof block === 'undefined') ? null : block.next;
    }

    /**
     * Get the branch for a particular C-shaped block.
     * @param id ID for block to get the branch for.
     * @param branchNum Which branch to select (e.g. for if-else).
     * @returns ID of block in the branch.
     */
    getBranch (id: string | null, branchNum: number | null) {
        if (!id) return null;
        const block = this._blocks[id];
        if (typeof block === 'undefined') return null;
        if (!branchNum) branchNum = 1;

        let inputName = Blocks.BRANCH_INPUT_PREFIX;
        if (branchNum > 1) {
            inputName += branchNum;
        }

        // Empty C-block?
        const input = block.inputs[inputName];
        return (typeof input === 'undefined') ? null : input.block;
    }

    /**
     * Get the opcode for a particular block
     * @param block The block to query
     * @returns the opcode corresponding to that block
     */
    getOpcode (block: VMBlock | undefined) {
        return (typeof block === 'undefined') ? null : block.opcode;
    }

    /**
     * Get all fields and their values for a block.
     * @param block The block to query.
     * @returns All fields and their values.
     */
    getFields (block: VMBlock | undefined) {
        return (typeof block === 'undefined') ? null : block.fields;
    }

    /**
     * Get all non-branch inputs for a block.
     * @param block the block to query.
     * @returns All non-branch inputs and their associated blocks.
     */
    getInputs (block: VMBlock | undefined) {
        if (typeof block === 'undefined') return null;
        let inputs = this._cache.inputs[block.id];
        if (typeof inputs !== 'undefined') {
            return inputs;
        }

        inputs = {};
        for (const input in block.inputs) {
            // Ignore blocks prefixed with branch prefix.
            if (input.substring(0, Blocks.BRANCH_INPUT_PREFIX.length) !==
                Blocks.BRANCH_INPUT_PREFIX) {
                inputs[input] = block.inputs[input];
            }
        }

        this._cache.inputs[block.id] = inputs;
        return inputs;
    }

    /**
     * Get mutation data for a block.
     * @param block The block to query.
     * @returns Mutation for the block.
     */
    getMutation (block: VMBlock | undefined) {
        return (typeof block === 'undefined') ? null : block.mutation;
    }

    /**
     * Get the top-level script for a given block.
     * @param id ID of block to query.
     * @returns ID of top-level script block.
     */
    getTopLevelScript (id?: string | null) {
        if (!id) return null;
        let block = this._blocks[id];
        if (typeof block === 'undefined') return null;
        while (block.parent !== null) {
            block = this._blocks[block.parent];
        }
        return block.id;
    }

    /**
     * Get all procedure definitions.
     * @param globalOnly True if only get global procedures.
     * @returns Procedure states.
     */
    getAllProcedureDefinitions (globalOnly: boolean | null): ProcedureMutation[] {
        const procedures = [];
        for (const id in this._blocks) {
            if (!Object.prototype.hasOwnProperty.call(this._blocks, id)) continue;
            const block = this._blocks[id];
            if (block.opcode === 'procedures_definition') {
                const internal = this._getCustomBlockInternal(block);
                if (internal && (!globalOnly || internal.mutation!.global)) {
                    this._cache.procedureDefinitions[internal.mutation!.proccode!] = id; // The outer define block id

                    const mutation = internal.mutation!;

                    procedures.push({
                        proccode: mutation.proccode,
                        argumentids: mutation.argumentids,
                        argumentnames: mutation.argumentnames,
                        argumentdefaults: mutation.argumentdefaults,
                        warp: mutation.warp,
                        return: mutation.return,
                        global: mutation.global,
                        generateshadows: mutation.generateshadows
                    });
                }
            }
        }
        return procedures;
    }

    /**
     * Get the procedure definition for a given name.
     * @param name Name of procedure to query.
     * @param globalOnly True if only find global procedures.
     * @returns ID of procedure definition.
     */
    getProcedureDefinition (name: string, globalOnly?: boolean) {
        const blockID = this._cache.procedureDefinitions[name];
        if (typeof blockID !== 'undefined') {
            if (blockID) {
                const internal = this._getCustomBlockInternal(this._blocks[blockID]);
                if (!globalOnly || internal?.mutation?.global) {
                    return blockID;
                }
            }

            return null;
        }

        for (const id in this._blocks) {
            if (!Object.prototype.hasOwnProperty.call(this._blocks, id)) continue;
            const block = this._blocks[id];
            if (block.opcode === 'procedures_definition') {
                const internal = this._getCustomBlockInternal(block);
                if (internal && internal.mutation!.proccode === name) {
                    this._cache.procedureDefinitions[name] = id; // The outer define block id
                    // suppose procedure proccode is unique in one target
                    if (!globalOnly || internal.mutation!.global) {
                        return id;
                    }
                    return null;
                }
            }
        }

        this._cache.procedureDefinitions[name] = null;
        return null;
    }

    /**
     * Get names and ids of parameters for the given procedure.
     * @param name Name of procedure to query.
     * @returns List of param names for a procedure.
     */
    getProcedureParamNamesAndIds (name: string) {
        return this.getProcedureParamNamesIdsAndDefaults(name)?.slice(0, 2) ?? null;
    }

    /**
     * Get names, ids, and defaults of parameters for the given procedure.
     * @param name Name of procedure to query.
     * @returns List of param names for a procedure.
     */
    getProcedureParamNamesIdsAndDefaults (name: string) {
        const cachedNames = this._cache.procedureParamNames[name];
        if (typeof cachedNames !== 'undefined') {
            return cachedNames;
        }

        for (const id in this._blocks) {
            if (!Object.prototype.hasOwnProperty.call(this._blocks, id)) continue;
            const block = this._blocks[id];
            if (block.opcode === 'procedures_prototype' &&
                block.mutation!.proccode === name) {
                const names = block.mutation!.argumentnames!;
                const ids = block.mutation!.argumentids!;
                const defaults = block.mutation!.argumentdefaults!;

                this._cache.procedureParamNames[name] = [names, ids, defaults];
                return this._cache.procedureParamNames[name];
            }
        }

        this._cache.procedureParamNames[name] = null;
        return null;
    }

    duplicate () {
        const newBlocks = new Blocks(this.runtime, this.forceNoGlow);
        newBlocks._blocks = Clone.simple(this._blocks);
        newBlocks._scripts = Clone.simple(this._scripts);
        return newBlocks;
    }
    // ---------------------------------------------------------------------

    /**
     * Create event listener for blocks, variables, and comments. Handles validation and
     * serves as a generic adapter between the blocks, variables, and the
     * runtime interface.
     * @param event Blockly "block" or "variable" event
     */
    blocklyListen (event: ListenableBlocklyEvents) {
        // Validate event
        if (typeof event !== 'object') return;
        if (
            typeof (event as ClipCCBlock.Events.BlockBase).blockId !== 'string' &&
            typeof (event as ClipCCBlock.Events.VarBase).varId !== 'string' &&
            typeof (event as ClipCCBlock.Events.CommentBase).commentId !== 'string'
        ) {
            return;
        }
        const stage = this.runtime.getTargetForStage();
        const editingTarget = this.runtime.getEditingTarget();

        // Block create/update/destroy
        switch (event.type) {
        case 'create': {
            const e = event as ClipCCBlock.Events.BlockCreate;
            const newBlocks = adapter(e as AdaptableEvents)!;
            const comments: Record<string, ClipCCBlock.BlockCommentState> = {};
            // A create event can create many blocks. Add them all.
            for (const block of newBlocks) {
                if (Object.prototype.hasOwnProperty.call(block, 'commentData')) {
                    comments[block.id] = block.commentData!;
                    delete block.commentData;
                }
                this.createBlock(block);
            }
            if (Object.keys(comments).length) {
                const currTarget = this.runtime.getEditingTarget();
                for (const blockId in comments) {
                    const commentData = comments[blockId];
                    currTarget?.createComment(
                        commentData.id,
                        blockId,
                        commentData.text ?? '',
                        commentData.x ?? 0,
                        commentData.y ?? 0,
                        commentData.width ?? 200,
                        commentData.height ?? 200,
                        commentData.collapsed ?? false
                    );
                }
            }
            break;
        }
        case 'change': {
            const e = event as ClipCCBlock.Events.BlockChange;
            if (e.element === 'comment') {
                const commentId = e.name;
                if (!commentId) break;
                this.changeCommentText(commentId, e.newValue as string);
                this.emitProjectChanged();
                break;
            }
            this.changeBlock({
                id: e.blockId!,
                element: e.element!,
                name: e.name!,
                value: e.newValue
            });
            break;
        }
        case 'move': {
            const e = event as ClipCCBlock.Events.BlockMove;
            this.moveBlock({
                id: e.blockId!,
                oldParent: e.oldParentId,
                oldInput: e.oldInputName,
                newParent: e.newParentId,
                newInput: e.newInputName,
                newCoordinate: e.newCoordinate
            });
            break;
        }
        case 'block_drag_outside': {
            const e = event as ClipCCBlock.BlockDragOutside;
            this.runtime.emitBlockDragUpdate(e.isOutside);
            break;
        }
        case 'block_drag_end': {
            const e = event as ClipCCBlock.BlockDragEnd;
            this.runtime.emitBlockDragUpdate(false /* areBlocksOverGui */);

            // Drag blocks onto another sprite
            if (e.isOutside) {
                const newBlocks = adapter(e)!;
                this.runtime.emitBlockEndDrag(newBlocks, e.blockId!);
            }
            break;
        }
        case 'delete': {
            const e = event as ClipCCBlock.Events.BlockDelete;
            // Don't accept delete events for missing blocks,
            // or shadow blocks being obscured.
            if (!Object.prototype.hasOwnProperty.call(this._blocks, e.blockId!) ||
                this._blocks[e.blockId!].shadow) {
                return;
            }
            // Inform any runtime to forget about glows on this script.
            if (this._blocks[e.blockId!].topLevel) {
                this.runtime.quietGlow(e.blockId!);
            }
            this.deleteBlock(e.blockId!);
            break;
        }
        case 'var_create': {
            const e = event as ClipCCBlock.VarCreate;
            // Check if the variable being created is global or local
            // If local, create a local var on the current editing target, as long
            // as there are no conflicts, and the current target is actually a sprite
            // If global or if the editing target is not present or we somehow got
            // into a state where a local var was requested for the stage,
            // create a stage (global) var after checking for name conflicts
            // on all the sprites.
            if (e.isLocal && editingTarget && !editingTarget.isStage && !e.isCloud) {
                if (!editingTarget.lookupVariableById(e.varId!)) {
                    editingTarget.createVariable(e.varId!, e.varName!, e.varType!);
                    this.emitProjectChanged();
                }
            } else if (stage) {
                if (stage.lookupVariableById(e.varId!)) {
                    // Do not re-create a variable if it already exists
                    return;
                }
                // Check for name conflicts in all of the targets
                const allTargets = this.runtime.targets.filter(t => t.isOriginal);
                for (const target of allTargets) {
                    if (target.lookupVariableByNameAndType(e.varName!, e.varType!, true)) {
                        return;
                    }
                }
                stage.createVariable(e.varId!, e.varName!, e.varType!, e.isCloud);
                this.emitProjectChanged();
            }
            break;
        }
        case 'var_rename': {
            const e = event as ClipCCBlock.Events.VarRename;
            if (editingTarget && Object.prototype.hasOwnProperty.call(editingTarget.variables, e.varId!)) {
                // This is a local variable, rename on the current target
                editingTarget.renameVariable(e.varId!, e.newName!);
                // Update all the blocks on the current target that use
                // this variable
                editingTarget.blocks.updateBlocksAfterVarRename(e.varId!, e.newName!);
            } else if (stage) {
                // This is a global variable
                stage.renameVariable(e.varId!, e.newName!);
                // Update all blocks on all targets that use the renamed variable
                const targets = this.runtime.targets;
                for (let i = 0; i < targets.length; i++) {
                    const currTarget = targets[i];
                    currTarget.blocks.updateBlocksAfterVarRename(e.varId!, e.newName!);
                }
            }
            this.emitProjectChanged();
            break;
        }
        case 'var_delete': {
            const e = event as ClipCCBlock.VarDelete;
            const target = (editingTarget && Object.prototype.hasOwnProperty.call(editingTarget.variables, e.varId!)) ?
                editingTarget : stage;
            if (!target) break;
            target.deleteVariable(e.varId!);
            this.emitProjectChanged();
            break;
        }
        case 'block_comment_create':
        case 'comment_create': {
            const e = event as ClipCCBlock.BlockCommentCreate | ClipCCBlock.Events.CommentCreate;
            if (this.runtime.getEditingTarget()) {
                const currTarget = this.runtime.getEditingTarget()!;
                currTarget.createComment(
                    e.commentId!,
                    (e as ClipCCBlock.BlockCommentCreate).blockId,
                    '',
                    (e as ClipCCBlock.Events.CommentCreate).json?.x ?? 0,
                    (e as ClipCCBlock.Events.CommentCreate).json?.y ?? 0,
                    (e as ClipCCBlock.Events.CommentCreate).json?.width ?? 200,
                    (e as ClipCCBlock.Events.CommentCreate).json?.height ?? 200,
                    (e as ClipCCBlock.Events.CommentCreate).json?.collapsed ?? false
                );

                if (currTarget.comments[e.commentId!].x === null &&
                    currTarget.comments[e.commentId!].y === null) {
                    // Block comments imported from 2.0 projects are imported with their
                    // x and y coordinates set to null so that scratch-blocks can
                    // auto-position them. If we are receiving a create event for these
                    // comments, then the auto positioning should have taken place.
                    // Update the x and y position of these comments to match the
                    // one from the event.
                    currTarget.comments[e.commentId!].x = (e as ClipCCBlock.Events.CommentCreate).json?.x ?? 0;
                    currTarget.comments[e.commentId!].y = (e as ClipCCBlock.Events.CommentCreate).json?.y ?? 0;
                }
            }
            this.emitProjectChanged();
            break;
        }
        case 'comment_change': {
            const e = event as ClipCCBlock.Events.CommentChange;
            this.changeCommentText(e.commentId!, e.newContents_);
            break;
        }
        case 'block_comment_move':
        case 'comment_move': {
            const e = event as ClipCCBlock.BlockCommentMove | ClipCCBlock.Events.CommentMove;
            if (this.runtime.getEditingTarget()) {
                const currTarget = this.runtime.getEditingTarget();
                if (currTarget && !Object.prototype.hasOwnProperty.call(currTarget.comments, e.commentId!)) {
                    log.warn(`Cannot change comment with id ${e.commentId} because it does not exist.`);
                    return;
                }
                const comment = currTarget!.comments[e.commentId!];
                const newCoord = e.newCoordinate_;
                comment.x = newCoord!.x;
                comment.y = newCoord!.y;

                this.emitProjectChanged();
            }
            break;
        }
        case 'block_comment_collapse':
        case 'comment_collapse': {
            const e = event as ClipCCBlock.BlockCommentCollapse | ClipCCBlock.Events.CommentCollapse;
            if (this.runtime.getEditingTarget()) {
                const currTarget = this.runtime.getEditingTarget();
                if (
                    currTarget &&
                        !Object.prototype.hasOwnProperty.call(
                            currTarget.comments,
                            e.commentId!
                        )
                ) {
                    log.warn(
                        `Cannot collapse comment with id ${e.commentId!} because it does not exist.`
                    );
                    return;
                }
                const comment = currTarget!.comments[e.commentId!];
                comment.minimized = !!e.newCollapsed;
                this.emitProjectChanged();
            }
            break;
        }
        case 'block_comment_resize':
        case 'comment_resize': {
            const e = event as ClipCCBlock.BlockCommentResize | ClipCCBlock.Events.CommentResize;
            if (this.runtime.getEditingTarget()) {
                const currTarget = this.runtime.getEditingTarget();
                if (
                    currTarget &&
                        !Object.prototype.hasOwnProperty.call(
                            currTarget.comments,
                            e.commentId!
                        )
                ) {
                    log.warn(
                        `Cannot resize comment with id ${e.commentId} because it does not exist.`
                    );
                    return;
                }
                const comment = currTarget!.comments[e.commentId!];
                comment.width = e.newSize!.width;
                comment.height = e.newSize!.height;
                this.emitProjectChanged();
            }
            break;
        }
        case 'block_comment_delete':
        case 'comment_delete': {
            const e = event as ClipCCBlock.BlockCommentDelete | ClipCCBlock.Events.CommentDelete;
            if (this.runtime.getEditingTarget()) {
                const currTarget = this.runtime.getEditingTarget();
                if (!Object.prototype.hasOwnProperty.call(currTarget!.comments, e.commentId!)) {
                    // If we're in this state, we have probably received
                    // a delete event from a workspace that we switched from
                    // (e.g. a delete event for a comment on sprite a's workspace
                    // when switching from sprite a to sprite b)
                    return;
                }
                delete currTarget!.comments[e.commentId!];
                if ('blockId' in e) {
                    const block = currTarget!.blocks.getBlock(e.blockId);
                    if (!block) {
                        log.warn(`Could not find block referenced by comment with id: ${e.commentId}`);
                        return;
                    }
                    delete block.comment;
                }

                this.emitProjectChanged();
            }
            break;
        }
        case 'func_change': {
            const e = event as ClipCCBlock.FuncChange;
            const {oldExtraState, newExtraState} = e;
            const procCode = oldExtraState?.proccode;
            if (!procCode) break;
            if (oldExtraState.global) {
                for (const target of this.runtime.targets) {
                    target.blocks.updateBlocksAfterFuncUpdate(procCode, newExtraState!);
                }
            } else {
                editingTarget?.blocks.updateBlocksAfterFuncUpdate(procCode, newExtraState!);
            }
            this.emitProjectChanged();
            break;
        }
        case 'click': {
            const e = event as ClipCCBlock.Events.Click;
            // UI event: clicked scripts toggle in the runtime.
            if (e.targetType === 'block') {
                const topBlockId = this.getTopLevelScript(e.blockId);
                if (!topBlockId) break;
                this.runtime.toggleScript(
                    topBlockId,
                    {stackClick: true}
                );
            }
            break;
        }
        }
    }

    // ---------------------------------------------------------------------

    /**
     * Reset all runtime caches.
     */
    resetCache () {
        this._cache = createCacheState();
    }

    /**
     * Emit a project changed event if this is a block container
     * that can affect the project state.
     */
    emitProjectChanged () {
        if (!this.forceNoGlow) {
            this.runtime.emitProjectChanged();
        }
    }

    /**
     * Block management: create blocks and scripts from a `create` event
     * @param block Blockly create event to be processed
     */
    createBlock (block: VMBlock) {
        // Does the block already exist?
        // Could happen, e.g., for an unobscured shadow.
        if (Object.prototype.hasOwnProperty.call(this._blocks, block.id)) {
            return;
        }
        // Create new block.
        this._blocks[block.id] = block;
        // Push block id to scripts array.
        // Blocks are added as a top-level stack if they are marked as a top-block
        // (if they were top-level XML in the event).
        if (block.topLevel) {
            this._addScript(block.id);
        }

        this.resetCache();

        // A new block was actually added to the block container,
        // emit a project changed event
        this.emitProjectChanged();
    }

    /**
     * Block management: change block field values
     * @param args Blockly change event to be processed
     * @param args.id The ID of the block associated with this event.
     * @param args.element The element that changed;
     *  one of 'field', 'comment', 'collapsed', 'disabled', 'inline', or 'mutation'
     * @param args.name The name of the field that changed, if this is a change to a field.
     * @param args.value The new value of the element.
     */
    changeBlock (args: {
        id: string,
        element: string,
        name?: string,
        value: unknown
    }) {
        // Validate
        if (['field', 'mutation', 'checkbox'].indexOf(args.element) === -1) return;
        let block = this._blocks[args.id];
        if (typeof block === 'undefined') return;
        switch (args.element) {
        case 'field':
            // TODO when the field of a monitored block changes,
            // update the checkbox in the flyout based on whether
            // a monitor for that current combination of selected parameters exists
            // e.g.
            // 1. check (current [v year])
            // 2. switch dropdown in flyout block to (current [v minute])
            // 3. the checkbox should become unchecked if we're not already
            //    monitoring current minute


            // Update block value
            if (!block.fields[args.name!]) return;
            if (args.name === 'VARIABLE' || args.name === 'LIST' ||
                args.name === 'BROADCAST_OPTION') {
                // Get variable name using the id in args.value.
                const variable = this.runtime.getEditingTarget()?.lookupVariableById(args.value as string);
                if (variable) {
                    block.fields[args.name].value = variable.name;
                    block.fields[args.name].id = args.value as string;
                }
            } else {
                // Changing the value in a dropdown
                block.fields[args.name!].value = args.value as string;

                // The selected item in the sensing of block menu needs to change based on the
                // selected target.  Set it to the first item in the menu list.
                // TODO: (#1787)
                if (block.opcode === 'sensing_of_object_menu') {
                    if (block.fields.OBJECT.value === '_stage_') {
                        this._blocks[block.parent!].fields.PROPERTY.value = 'backdrop #';
                    } else {
                        this._blocks[block.parent!].fields.PROPERTY.value = 'x position';
                    }
                    this.runtime.requestBlocksUpdate();
                }

                const flyoutBlock = block.shadow && block.parent ? this._blocks[block.parent] : block;
                if (flyoutBlock.isMonitored) {
                    this.runtime.requestUpdateMonitor(Map({
                        id: flyoutBlock.id,
                        params: this._getBlockParams(flyoutBlock)
                    }));
                }
            }
            break;
        case 'mutation':
            block.mutation = JSON.parse(args.value as string);
            break;
        case 'checkbox': {
            // A checkbox usually has a one to one correspondence with the monitor
            // block but in the case of monitored reporters that have arguments,
            // map the old id to a new id, creating a new monitor block if necessary
            if (block.fields && Object.keys(block.fields).length > 0 &&
                block.opcode !== 'data_variable' && block.opcode !== 'data_listcontents') {

                // This block has an argument which needs to get separated out into
                // multiple monitor blocks with ids based on the selected argument
                const newId = getMonitorIdForBlockWithArgs(block.id, block.fields);
                // Note: we're not just constantly creating a longer and longer id everytime we check
                // the checkbox because we're using the id of the block in the flyout as the base

                // check if a block with the new id already exists, otherwise create
                let newBlock = this.runtime.monitorBlocks.getBlock(newId);
                if (!newBlock) {
                    newBlock = JSON.parse(JSON.stringify(block));
                    newBlock!.id = newId;
                    this.runtime.monitorBlocks.createBlock(newBlock!);
                }

                block = newBlock!; // Carry on through the rest of this code with newBlock
            }

            const wasMonitored = block.isMonitored;
            block.isMonitored = args.value as boolean;

            // Variable blocks may be sprite specific depending on the owner of the variable
            let isSpriteLocalVariable = false;
            if (block.opcode === 'data_variable') {
                isSpriteLocalVariable = !(this.runtime.getTargetForStage()?.variables[block.fields.VARIABLE.id!]);
            } else if (block.opcode === 'data_listcontents') {
                isSpriteLocalVariable = !(this.runtime.getTargetForStage()?.variables[block.fields.LIST.id!]);
            }

            const isSpriteSpecific = isSpriteLocalVariable ||
                (Object.prototype.hasOwnProperty.call(this.runtime.monitorBlockInfo, block.opcode) &&
                this.runtime.monitorBlockInfo[block.opcode].isSpriteSpecific);
            if (isSpriteSpecific) {
                // If creating a new sprite specific monitor, the only possible target is
                // the current editing one b/c you cannot dynamically create monitors.
                // Also, do not change the targetId if it has already been assigned
                block.targetId = block.targetId || this.runtime.getEditingTarget()?.id;
            } else {
                block.targetId = null;
            }

            if (wasMonitored && !block.isMonitored) {
                this.runtime.requestHideMonitor(block.id);
            } else if (!wasMonitored && block.isMonitored) {
                // Tries to show the monitor for specified block. If it doesn't exist, add the monitor.
                if (!this.runtime.requestShowMonitor(block.id)) {
                    this.runtime.requestAddMonitor(MonitorRecord({
                        id: block.id,
                        targetId: block.targetId,
                        spriteName: block.targetId ?
                            this.runtime.getTargetById(block.targetId)?.getName() ?? null :
                            null,
                        opcode: block.opcode,
                        params: this._getBlockParams(block),
                        // @todo(vm#565) for numerical values with decimals, some countries use comma
                        value: '',
                        mode: block.opcode === 'data_listcontents' ? 'list' : 'default'
                    }));
                }
            }
            break;
        }
        }

        this.emitProjectChanged();

        this.resetCache();
    }

    /**
     * Block management: move blocks from parent to parent
     * @param e Blockly move event to be processed
     * @param e.id The ID of the block associated with this event.
     * @param e.oldParent The ID of the old parent block. Undefined if it was a top-level block.
     * @param e.oldInput The name of the old input. Undefined if it was a top-level block or the parent's next block.
     * @param e.newParent The ID of the new parent block. Undefined if it is a top-level block.
     * @param e.newInput The name of the new input. Undefined if it is a top-level block or the parent's next block.
     * @param e.newCoordinate The new X and Y workspace coordinates of the block if it is a top-level block.
     *  Undefined if it is not a top level block.
     */
    moveBlock (e: {
        id: string,
        oldParent?: string,
        oldInput?: string,
        newParent?: string,
        newInput?: string,
        newCoordinate?: ClipCCBlock.utils.Coordinate
    }) {
        if (!Object.prototype.hasOwnProperty.call(this._blocks, e.id)) {
            return;
        }

        const block = this._blocks[e.id];
        // Track whether a change actually occurred
        // ignoring changes like routine re-positioning
        // of a block when loading a workspace
        let didChange = false;

        // Move coordinate changes.
        if (e.newCoordinate) {

            didChange = (block.x !== e.newCoordinate.x) || (block.y !== e.newCoordinate.y);

            block.x = e.newCoordinate.x;
            block.y = e.newCoordinate.y;
        }

        // Remove from any old parent.
        if (typeof e.oldParent !== 'undefined') {
            const oldParent = this._blocks[e.oldParent];
            if (typeof e.oldInput !== 'undefined' &&
                oldParent.inputs[e.oldInput].block === e.id) {
                // This block was connected to an input. We either want to
                // restore the shadow block that previously occupied
                // this input, or null out the input's block.
                const shadow = oldParent.inputs[e.oldInput].shadow;
                if (shadow && e.id !== shadow) {
                    oldParent.inputs[e.oldInput].block = shadow;
                    this._blocks[shadow].parent = oldParent.id;
                } else {
                    oldParent.inputs[e.oldInput].block = null;
                    if (e.id !== shadow) {
                        this._blocks[e.id].parent = null;
                    }
                }
            } else if (oldParent.next === e.id) {
                // This block was connected to the old parent's next connection.
                oldParent.next = null;
                this._blocks[e.id].parent = null;
            }
            didChange = true;
        }

        // Is this block a top-level block?
        if (typeof e.newParent === 'undefined') {
            if (!this._blocks[e.id].shadow) {
                this._addScript(e.id);
            }
        } else {
            // Remove script, if one exists.
            this._deleteScript(e.id);
            // Otherwise, try to connect it in its new place.
            if (typeof e.newInput === 'undefined') {
                // Moved to the new parent's next connection.
                this._blocks[e.newParent].next = e.id;
            } else {
                // Moved to the new parent's input.
                // Don't obscure the shadow block.
                let oldShadow = null;
                if (Object.prototype.hasOwnProperty.call(this._blocks[e.newParent].inputs, e.newInput)) {
                    oldShadow = this._blocks[e.newParent].inputs[e.newInput].shadow;
                }

                // If the block being attached is itself a shadow, make sure to set
                // both block and shadow to that blocks ID. This happens when adding
                // inputs to a custom procedure.
                if (this._blocks[e.id].shadow) oldShadow = e.id;

                this._blocks[e.newParent].inputs[e.newInput] = {
                    name: e.newInput,
                    block: e.id,
                    shadow: oldShadow
                };
            }
            this._blocks[e.id].parent = e.newParent;
            didChange = true;
        }
        this.resetCache();

        if (didChange) this.emitProjectChanged();
    }

    /**
     * Block management: run all blocks.
     * @param runtime Runtime to run all blocks in.
     */
    runAllMonitored (runtime: Runtime) {
        if (this._cache._monitored === null) {
            this._cache._monitored = Object.keys(this._blocks)
                .filter(blockId => this.getBlock(blockId)?.isMonitored)
                .map(blockId => {
                    const targetId = this.getBlock(blockId)!.targetId;
                    return {
                        blockId,
                        target: targetId ? runtime.getTargetById(targetId) : null
                    };
                });
        }

        const monitored = this._cache._monitored;
        for (let i = 0; i < monitored.length; i++) {
            const {blockId, target} = monitored[i];
            runtime.addMonitorScript(blockId, target);
        }
    }

    /**
     * Block management: delete blocks and their associated scripts. Does nothing if a block
     * with the given ID does not exist.
     * @param blockId Id of block to delete
     */
    deleteBlock (blockId: string) {
        // @todo In runtime, stop threads running on this script.

        // Get block
        const block = this._blocks[blockId];
        if (!block) {
            // No block with the given ID exists
            return;
        }

        // Delete children
        if (block.next !== null) {
            this.deleteBlock(block.next);
        }

        // Delete inputs (including branches)
        for (const input in block.inputs) {
            // If it's null, the block in this input moved away.
            if (block.inputs[input].block !== null) {
                this.deleteBlock(block.inputs[input].block);
            }
            // Delete obscured shadow blocks.
            if (block.inputs[input].shadow !== null &&
                block.inputs[input].shadow !== block.inputs[input].block) {
                this.deleteBlock(block.inputs[input].shadow);
            }
        }

        // Delete any script starting with this block.
        this._deleteScript(blockId);

        // Delete block itself.
        delete this._blocks[blockId];

        this.resetCache();
        this.emitProjectChanged();
    }

    /**
     * Delete all blocks and their associated scripts.
     */
    deleteAllBlocks () {
        const blockIds = Object.keys(this._blocks);
        blockIds.forEach(blockId => this.deleteBlock(blockId));
    }

    /**
     * Change comment text based on id and text.
     * @param commentId Id of comment to change
     * @param newText New text for comment
     */
    changeCommentText (commentId: string, newText: string | undefined) {
        // if newText is undefined, it's indicates that the comment is being deleted
        // it will be handled by `block_comment_delete` event, so we can ignore it here.
        if (!newText) return;
        const currTarget = this.runtime.getEditingTarget();
        if (!currTarget) return;
        if (!Object.prototype.hasOwnProperty.call(currTarget.comments, commentId)) {
            log.warn(`Cannot change comment with id ${commentId} because it does not exist.`);
            return;
        }
        const comment = currTarget.comments[commentId];
        comment.text = newText;
        this.emitProjectChanged();
    }

    /**
     * Returns a map of all references to variables or lists from blocks
     * in this block container.
     * @param optBlocks Optional list of blocks to constrain the search to.
     * This is useful for getting variable/list references for a stack of blocks instead
     * of all blocks on the workspace
     * @param optIncludeBroadcast Optional whether to include broadcast fields.
     * @returns A map of variable ID to a list of all variable references
     * for that ID. A variable reference contains the field referencing that variable
     * and also the type of the variable being referenced.
     */
    getAllVariableAndListReferences (optBlocks?: Record<string, VMBlock> | null, optIncludeBroadcast?: boolean) {
        const blocks = optBlocks ? optBlocks : this._blocks;
        const allReferences = Object.create(null);
        for (const blockId in blocks) {
            let varOrListField = null;
            let varType = null;
            if (blocks[blockId].fields.VARIABLE) {
                varOrListField = blocks[blockId].fields.VARIABLE;
                varType = Variable.SCALAR_TYPE;
            } else if (blocks[blockId].fields.LIST) {
                varOrListField = blocks[blockId].fields.LIST;
                varType = Variable.LIST_TYPE;
            } else if (optIncludeBroadcast && blocks[blockId].fields.BROADCAST_OPTION) {
                varOrListField = blocks[blockId].fields.BROADCAST_OPTION;
                varType = Variable.BROADCAST_MESSAGE_TYPE;
            }
            if (varOrListField) {
                const currVarId = varOrListField.id;
                if (allReferences[currVarId!]) {
                    allReferences[currVarId!].push({
                        referencingField: varOrListField,
                        type: varType
                    });
                } else {
                    allReferences[currVarId!] = [{
                        referencingField: varOrListField,
                        type: varType
                    }];
                }
            }
        }
        return allReferences;
    }

    /**
     * Keep blocks up to date after a variable gets renamed.
     * @param varId The id of the variable that was renamed
     * @param newName The new name of the variable that was renamed
     */
    updateBlocksAfterVarRename (varId: string, newName: string) {
        const blocks = this._blocks;
        for (const blockId in blocks) {
            let varOrListField = null;
            if (blocks[blockId].fields.VARIABLE) {
                varOrListField = blocks[blockId].fields.VARIABLE;
            } else if (blocks[blockId].fields.LIST) {
                varOrListField = blocks[blockId].fields.LIST;
            }
            if (varOrListField) {
                const currFieldId = varOrListField.id;
                if (varId === currFieldId) {
                    varOrListField.value = newName;
                }
            }
        }
    }

    /**
     * Keep blocks up to date after a procedure gets updated.
     * @param procCode The procCode of procedure to update
     * @param newExtraState The new extra state of procedure
     */
    updateBlocksAfterFuncUpdate (
        procCode: string,
        newExtraState: ClipCCBlock.proceduresSerializer.ProcedureExtraState
    ) {
        const blocks = this._blocks;
        for (const blockId in blocks) {
            const block = blocks[blockId];
            if (block.opcode === 'procedures_prototype') {
                if (block.mutation?.proccode === procCode) {
                    block.mutation.proccode = newExtraState.proccode;
                    block.mutation.argumentids = newExtraState.argumentids;
                    block.mutation.argumentnames = newExtraState.argumentnames;
                    block.mutation.argumentdefaults = newExtraState.argumentdefaults;
                    block.mutation.warp = newExtraState.warp;
                    block.mutation.global = newExtraState.global;
                    block.mutation.return = newExtraState.return;
                }
            } else if (block.opcode === 'procedures_call') {
                if (block.mutation?.proccode === procCode) {
                    block.mutation.proccode = newExtraState.proccode;
                    block.mutation.argumentids = newExtraState.argumentids;
                    block.mutation.warp = newExtraState.warp;
                    block.mutation.global = newExtraState.global;
                    block.mutation.return = newExtraState.return;
                }
            }
        }
        this.resetCache();
    }

    /**
     * Keep blocks up to date after they are shared between targets.
     * @param isStage If the new target is a stage.
     */
    updateTargetSpecificBlocks (isStage?: boolean) {
        const blocks = this._blocks;
        for (const blockId in blocks) {
            if (isStage && blocks[blockId].opcode === 'event_whenthisspriteclicked') {
                blocks[blockId].opcode = 'event_whenstageclicked';
            } else if (!isStage && blocks[blockId].opcode === 'event_whenstageclicked') {
                blocks[blockId].opcode = 'event_whenthisspriteclicked';
            }
        }
    }

    /**
     * Update blocks after a sound, costume, or backdrop gets renamed.
     * Any block referring to the old name of the asset should get updated
     * to refer to the new name.
     * @param oldName The old name of the asset that was renamed.
     * @param newName The new name of the asset that was renamed.
     * @param assetType String representation of the kind of asset
     * that was renamed. This can be one of 'sprite','costume', 'sound', or
     * 'backdrop'.
     */
    updateAssetName (oldName: string, newName: string, assetType: string) {
        let getAssetField;
        if (assetType === 'costume') {
            getAssetField = this._getCostumeField.bind(this);
        } else if (assetType === 'sound') {
            getAssetField = this._getSoundField.bind(this);
        } else if (assetType === 'backdrop') {
            getAssetField = this._getBackdropField.bind(this);
        } else if (assetType === 'sprite') {
            getAssetField = this._getSpriteField.bind(this);
        } else {
            return;
        }
        const blocks = this._blocks;
        for (const blockId in blocks) {
            const assetField = getAssetField(blockId);
            if (assetField && assetField.value === oldName) {
                assetField.value = newName;
            }
        }
    }

    /**
     * Update sensing_of blocks after a variable gets renamed.
     * @param oldName The old name of the variable that was renamed.
     * @param newName The new name of the variable that was renamed.
     * @param targetName The name of the target the variable belongs to.
     * @returns Returns true if any of the blocks were updated.
     */
    updateSensingOfReference (oldName: string, newName: string, targetName: string) {
        const blocks = this._blocks;
        let blockUpdated = false;
        for (const blockId in blocks) {
            const block = blocks[blockId];
            if (block.opcode === 'sensing_of' &&
                block.fields.PROPERTY.value === oldName &&
                // If block and shadow are different, it means a block is inserted to OBJECT, and should be ignored.
                block.inputs.OBJECT.block === block.inputs.OBJECT.shadow) {
                const inputBlock = this.getBlock(block.inputs.OBJECT.block);
                if (inputBlock?.fields.OBJECT.value === targetName) {
                    block.fields.PROPERTY.value = newName;
                    blockUpdated = true;
                }
            }
        }
        if (blockUpdated) this.resetCache();
        return blockUpdated;
    }

    /**
     * Helper function to retrieve a costume menu field from a block given its id.
     * @param blockId A unique identifier for a block
     * @returns The costume menu field of the block with the given block id.
     * Null if either a block with the given id doesn't exist or if a costume menu field
     * does not exist on the block with the given id.
     */
    protected _getCostumeField (blockId: string) {
        const block = this.getBlock(blockId);
        if (block && Object.prototype.hasOwnProperty.call(block.fields, 'COSTUME')) {
            return block.fields.COSTUME;
        }
        return null;
    }

    /**
     * Helper function to retrieve a sound menu field from a block given its id.
     * @param blockId A unique identifier for a block
     * @returns The sound menu field of the block with the given block id.
     * Null, if either a block with the given id doesn't exist or if a sound menu field
     * does not exist on the block with the given id.
     */
    protected _getSoundField (blockId: string) {
        const block = this.getBlock(blockId);
        if (block && Object.prototype.hasOwnProperty.call(block.fields, 'SOUND_MENU')) {
            return block.fields.SOUND_MENU;
        }
        return null;
    }

    /**
     * Helper function to retrieve a backdrop menu field from a block given its id.
     * @param blockId A unique identifier for a block
     * @returns The backdrop menu field of the block with the given block id.
     * Null, if either a block with the given id doesn't exist or if a backdrop menu field
     * does not exist on the block with the given id.
     */
    protected _getBackdropField (blockId: string) {
        const block = this.getBlock(blockId);
        if (block && Object.prototype.hasOwnProperty.call(block.fields, 'BACKDROP')) {
            return block.fields.BACKDROP;
        }
        return null;
    }

    /**
     * Helper function to retrieve a sprite menu field from a block given its id.
     * @param blockId A unique identifier for a block
     * @returns The sprite menu field of the block with the given block id.
     * Null, if either a block with the given id doesn't exist or if a sprite menu field
     * does not exist on the block with the given id.
     */
    protected _getSpriteField (blockId: string) {
        const block = this.getBlock(blockId);
        if (!block) {
            return null;
        }
        const spriteMenuNames = ['TOWARDS', 'TO', 'OBJECT', 'VIDEOONMENU2',
            'DISTANCETOMENU', 'TOUCHINGOBJECTMENU', 'CLONE_OPTION'];
        for (let i = 0; i < spriteMenuNames.length; i++) {
            const menuName = spriteMenuNames[i];
            if (Object.prototype.hasOwnProperty.call(block.fields, menuName)) {
                return block.fields[menuName];
            }
        }
        return null;
    }

    // ---------------------------------------------------------------------

    /**
     * Encode all of `this._blocks` as an XML string usable
     * by a Blockly/scratch-blocks workspace.
     * @param comments Map of comments referenced by id
     * @deprecated Use `toState` instead.
     * @returns String of XML representing this object's blocks.
     */
    toXML (comments?: Record<string, Comment>) {
        return this._scripts.map(script => this.blockToXML(script, comments)).join();
    }

    /**
     * Recursively encode an individual block and its children
     * into a Blockly/scratch-blocks XML string.
     * @param blockId ID of block to encode.
     * @param comments Map of comments referenced by id
     * @returns String of XML representing this block and any children.
     */
    blockToXML (blockId: string, comments?: Record<string, Comment>) {
        const block = this._blocks[blockId];
        // block should exist, but currently some blocks' next property point
        // to a blockId for non-existent blocks. Until we track down that behavior,
        // this early exit allows the project to load.
        if (!block) return;
        // Encode properties of this block.
        const tagName = (block.shadow) ? 'shadow' : 'block';
        let xmlString =
            `<${tagName}
                id="${block.id}"
                type="${block.opcode}"
                ${block.topLevel ? `x="${block.x}" y="${block.y}"` : ''}
            >`;
        const commentId = block.comment;
        if (commentId) {
            if (comments) {
                if (Object.prototype.hasOwnProperty.call(comments, commentId)) {
                    xmlString += comments[commentId].toXML();
                } else {
                    log.warn(`Could not find comment with id: ${commentId} in provided comment descriptions.`);
                }
            } else {
                log.warn(`Cannot serialize comment with id: ${commentId}; no comment descriptions provided.`);
            }
        }
        // Add any mutation. Must come before inputs.
        if (block.mutation) {
            xmlString += this.mutationToXML(block.mutation);
        }
        const danglingInputs = this._getDanglingInputs(block);
        // Add any inputs on this block.
        for (const input in block.inputs) {
            if (!Object.prototype.hasOwnProperty.call(block.inputs, input)) continue;
            /*
            In Scratch, blocks may have "dangling" inputs that mismatched with Blockly definiton,
            which leads workspace load error in *modern* Blockly. It usually happens in procedure
            call/prototype blocks when their arguments are modified.
            */
            if (danglingInputs.has(input)) continue;
            const blockInput = block.inputs[input];
            // Only encode a value tag if the value input is occupied.
            if (blockInput.block || blockInput.shadow) {
                xmlString += `<value name="${blockInput.name}">`;
                if (blockInput.block) {
                    xmlString += this.blockToXML(blockInput.block, comments);
                }
                if (blockInput.shadow && blockInput.shadow !== blockInput.block) {
                    // Obscured shadow.
                    xmlString += this.blockToXML(blockInput.shadow, comments);
                }
                xmlString += '</value>';
            }
        }
        // Add any fields on this block.
        for (const field in block.fields) {
            if (!Object.prototype.hasOwnProperty.call(block.fields, field)) continue;
            const blockField = block.fields[field];
            xmlString += `<field name="${blockField.name}"`;
            const fieldId = blockField.id;
            if (fieldId) {
                xmlString += ` id="${fieldId}"`;
            }
            const varType = blockField.variableType;
            if (typeof varType === 'string') {
                xmlString += ` variabletype="${varType}"`;
            }
            let value = blockField.value;
            if (typeof value === 'string') {
                value = xmlEscape(blockField.value!);
            }
            xmlString += `>${value}</field>`;
        }
        // Add blocks connected to the next connection.
        if (block.next) {
            xmlString += `<next>${this.blockToXML(block.next, comments)}</next>`;
        }
        xmlString += `</${tagName}>`;
        return xmlString;
    }

    /**
     * Encode all of `this._blocks` as a JSON array usable
     * by a Blockly/scratch-blocks workspace.
     * @param comments Map of comments referenced by id
     * @returns JSON array representing this object's blocks.
     */
    toState (comments?: Record<string, Comment>){
        return this._scripts
            .map(script => this.blockToState(script, comments))
            .filter((script): script is ClipCCBlock.serialization.blocks.State => !!script); // Filter out nulls
    }

    /**
     * Recursively encode an individual block and its children
     * into a Blockly/scratch-blocks JSON object.
     * @param blockId ID of block to encode.
     * @param comments Map of comments referenced by id
     * @returns JSON object representing this block and any children.
     */
    blockToState (blockId: string, comments?: Record<string, Comment>) {
        const block = this._blocks[blockId];
        // block should exist, but currently some blocks' next property point
        // to a blockId for non-existent blocks. Until we track down that behavior,
        // this early exit allows the project to load.
        if (!block) return;

        const state: ClipCCBlock.serialization.blocks.State = {
            id: block.id,
            type: block.opcode
        };

        if (block.topLevel) {
            state.x = block.x;
            state.y = block.y;
        }

        const commentId = block.comment;
        if (commentId) {
            if (comments) {
                if (Object.prototype.hasOwnProperty.call(comments, commentId)) {
                    const comment = comments[commentId];
                    state.icons = {
                        comment: {
                            id: comment.id,
                            text: comment.text,
                            height: comment.height,
                            width: comment.width,
                            x: comment.x,
                            y: comment.y,
                            collapsed: comment.minimized
                        }
                    };
                } else {
                    log.warn(`Could not find comment with id: ${commentId} in provided comment descriptions.`);
                }
            } else {
                log.warn(`Cannot serialize comment with id: ${commentId}; no comment descriptions provided.`);
            }
        }

        // Add any mutation.
        if (block.mutation) {
            if (block.opcode === 'procedures_prototype' &&
                Object.values(block.inputs).some(input => input.block !== null)) {
                state.extraState = {
                    ...block.mutation,
                    hasSerializedInputs: true
                };
            } else {
                state.extraState = block.mutation;
            }
        }

        const danglingInputs = this._getDanglingInputs(block);
        // Processing inputs
        for (const input in block.inputs) {
            if (!Object.prototype.hasOwnProperty.call(block.inputs, input)) continue;
            /*
            In Scratch, blocks may have "dangling" inputs that mismatched with Blockly definiton,
            which leads workspace load error in *modern* Blockly. It usually happens in procedure
            call/prototype blocks when their arguments are modified.
            */
            if (danglingInputs.has(input)) continue;
            const blockInput = block.inputs[input];
            if (blockInput.block || blockInput.shadow) {
                if (!state.inputs) state.inputs = {};
                const inputState: ClipCCBlock.serialization.blocks.ConnectionState = {};
                if (blockInput.block) {
                    if (blockInput.block === blockInput.shadow) {
                        inputState.shadow = this.blockToState(blockInput.block, comments);
                    } else {
                        inputState.block = this.blockToState(blockInput.block, comments);
                        if (blockInput.shadow) {
                            inputState.shadow = this.blockToState(blockInput.shadow, comments);
                        }
                    }
                } else if (blockInput.shadow) {
                    inputState.shadow = this.blockToState(blockInput.shadow, comments);
                }
                state.inputs[blockInput.name] = inputState;
            }
        }

        // Processing fields
        for (const field in block.fields) {
            if (!Object.prototype.hasOwnProperty.call(block.fields, field)) continue;
            const blockField = block.fields[field];
            if (!state.fields) state.fields = {};

            const fieldId = blockField.id;
            if (fieldId) {
                state.fields[blockField.name] = {
                    id: fieldId,
                    value: blockField.value
                };
                if (blockField.variableType) {
                    state.fields[blockField.name].variableType = blockField.variableType;
                }
            } else {
                state.fields[blockField.name] = blockField.value;
            }
        }

        // Add blocks connected to the next connection.
        if (block.next) {
            state.next = {
                block: this.blockToState(block.next, comments)
            };
        }

        return state;
    }

    /**
     * Recursively encode a mutation object to XML.
     * @param mutation Object representing a mutation.
     * @deprecated Use `blockToState` instead and include the mutation in the `extraState` property.
     * @returns XML string representing a mutation.
     */
    mutationToXML (mutation: VMMutation) {
        let mutationString = `<${mutation.tagName}`;
        for (const prop in mutation) {
            if (prop === 'children' || prop === 'tagName') continue;
            let mutationValue = (typeof mutation[prop] === 'string') ?
                xmlEscape(mutation[prop]) : mutation[prop];

            // Handle dynamic extension blocks
            if (prop === 'blockInfo') {
                mutationValue = xmlEscape(JSON.stringify(mutation[prop]));
            }

            mutationString += ` ${prop}="${mutationValue}"`;
        }
        mutationString += '>';
        if (mutation.children) {
            for (let i = 0; i < mutation.children.length; i++) {
                mutationString += this.mutationToXML(mutation.children[i]);
            }
        }
        mutationString += `</${mutation.tagName}>`;
        return mutationString;
    }

    // ---------------------------------------------------------------------
    /**
     * Helper to serialize block fields and input fields for reporting new monitors
     * @param block Block to be paramified.
     * @returns object of param key/values.
     */
    _getBlockParams (block: VMBlock) {
        const params: Record<string, unknown> = {};
        for (const key in block.fields) {
            params[key] = block.fields[key].value;
        }
        for (const inputKey in block.inputs) {
            const inputBlock = this._blocks[block.inputs[inputKey].block!];
            if (!inputBlock) continue;
            for (const key in inputBlock.fields) {
                params[key] = inputBlock.fields[key].value;
            }
        }
        return params;
    }

    /**
     * Helper to get the corresponding internal procedure definition block
     * @param defineBlock Outer define block.
     * @returns internal definition block which has the mutation.
     */
    protected _getCustomBlockInternal (defineBlock: VMBlock) {
        if (defineBlock.inputs?.custom_block?.block) {
            return this._blocks[defineBlock.inputs.custom_block.block];
        }
    }

    /**
     * Helper to add a stack to `this._scripts`.
     * @param topBlockId ID of block that starts the script.
     */
    protected _addScript (topBlockId: string) {
        const i = this._scripts.indexOf(topBlockId);
        if (i > -1) return; // Already in scripts.
        this._scripts.push(topBlockId);
        // Update `topLevel` property on the top block.
        this._blocks[topBlockId].topLevel = true;
    }

    /**
     * Helper to remove a script from `this._scripts`.
     * @param topBlockId ID of block that starts the script.
     */
    protected _deleteScript (topBlockId: string) {
        const i = this._scripts.indexOf(topBlockId);
        if (i > -1) this._scripts.splice(i, 1);
        // Update `topLevel` property on the top block.
        if (this._blocks[topBlockId]) this._blocks[topBlockId].topLevel = false;
    }

    /**
     * Get dangling inputs in a block.
     * @param block The block to check
     * @returns True if the input is dangling
     */
    protected _getDanglingInputs (block: VMBlock) {
        const danglingInputs = new Set();
        // It's most possible to have dangling inputs when mutation exists, other sequences need to read the Blockly
        // definition to validate inputs. just skip now.
        const blacklistedBlocks = ['procedures_call', 'procedures_prototype'];
        if (blacklistedBlocks.includes(block.opcode) && block.mutation && block.mutation.argumentids) {
            const argumentIds = block.mutation.argumentids;
            if (!Array.isArray(argumentIds)) return danglingInputs;
            for (const inputName in block.inputs) {
                if (!argumentIds.includes(inputName)) {
                    danglingInputs.add(inputName);
                }
            }
        }
        return danglingInputs;
    }
}

export default Blocks;
