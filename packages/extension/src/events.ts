/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

import type {BlockFunction} from './interfaces/common';

export interface AbstractEvent {
    type: string;
}

export interface UpdatePrimitivesEvent extends AbstractEvent {
    type: 'UPDATE_PRIMITIVES';
    primitives?: Record<string, BlockFunction>;
    hats?: Record<string, {
        edgeActivated?: boolean;
        restartExistingThreads?: boolean;
    }>;
}

export interface UpdateBlocksEvent extends AbstractEvent {
    type: 'UPDATE_BLOCKS';
    /** Map of block definitions. */
    blocks: Record<string, any>;
    /** Array of static blocks' JSON, used for theme injection in GUI. */
    blocksJSON: any[];
    /** Map of custom field implementations. */
    fields: Record<string, any>;
}
