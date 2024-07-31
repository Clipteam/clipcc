/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

import * as goog from 'google-closure-library/closure/goog/goog.js';
goog.declareModuleId('Blockly.Events');

import {Abstract} from './abstract';
import {BlockBase} from './block_base';
import {BlockChange} from './block_change';
import {BlockCreate} from './block_create';
import {BlockDelete} from './block_delete';
import {EndBlockDrag} from './block_drag_end';
import {DragBlockOutside} from './block_drag_outside';
import {BlockMove} from './block_move';
import {CommentBase} from './comment_base';
import {CommentChange} from './comment_change';
import {CommentCreate} from './comment_create';
import {CommentDelete} from './comment_delete';
import {CommentMove} from './comment_move';
import {Ui} from './ui';
import {VarBase} from './var_base';
import {VarCreate} from './var_create';
import {VarDelete} from './var_delete';
import {VarRename} from './var_rename';
import * as eventUtils from './utils';

export {
  Abstract,
  BlockBase,
  BlockChange,
  BlockCreate,
  BlockDelete,
  BlockMove,
  EndBlockDrag,
  DragBlockOutside,
  CommentBase,
  CommentChange,
  CommentCreate,
  CommentDelete,
  CommentMove,
  Ui,
  VarBase,
  VarCreate,
  VarDelete,
  VarRename
};

export const BLOCK_CHANGE = eventUtils.BLOCK_CHANGE;
export const BLOCK_CREATE = eventUtils.BLOCK_CREATE;
export const BLOCK_DELETE = eventUtils.BLOCK_DELETE;
export const BLOCK_MOVE = eventUtils.BLOCK_MOVE;
export const CHANGE = eventUtils.CHANGE;
export const COMMENT_CHANGE = eventUtils.COMMENT_CHANGE;
export const COMMENT_CREATE = eventUtils.COMMENT_CREATE;
export const COMMENT_DELETE = eventUtils.COMMENT_DELETE;
export const COMMENT_MOVE = eventUtils.COMMENT_MOVE;
export const CREATE = eventUtils.CREATE;
export const DELETE = eventUtils.DELETE;
export const DRAG_OUTSIDE = eventUtils.DRAG_OUTSIDE;
export const END_DRAG = eventUtils.END_DRAG;
export const MOVE = eventUtils.MOVE;
export const UI = eventUtils.UI;
export const VAR_CREATE = eventUtils.VAR_CREATE;
export const VAR_DELETE = eventUtils.VAR_DELETE;
export const VAR_RENAME = eventUtils.VAR_RENAME;

export const clearPendingUndo = eventUtils.clearPendingUndo;
export const disable = eventUtils.disable;
export const enable = eventUtils.enable;
export const filter = eventUtils.filter;
export const fire = eventUtils.fire;
export const fromJson = eventUtils.fromJson;
export const getDescendantIds = eventUtils.getDescendantIds;
export const get = eventUtils.get;
export const getGroup = eventUtils.getGroup;
export const getRecordUndo = eventUtils.getRecordUndo;
export const isEnabled = eventUtils.isEnabled;
export const register = eventUtils.register;
export const setGroup = eventUtils.setGroup;
export const setRecordUndo = eventUtils.setRecordUndo;
export const disableOrphans = eventUtils.disableOrphans;
