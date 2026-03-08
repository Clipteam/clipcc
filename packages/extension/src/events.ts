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
    blocks: any[];
    fields: any[];
}
