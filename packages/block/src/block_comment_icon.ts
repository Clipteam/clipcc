/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {AnchoredComment} from './anchored_comment';

export interface BlockCommentState extends Blockly.icons.CommentState {
  text: string;
  height: number;
  width: number;
  x: number;
  y: number;
  collapsed: boolean;
}

// Should implement Blockly.ICommentIcon, but seems it's not exported
export class BlockCommentIcon extends Blockly.icons.Icon implements Blockly.ISerializable, Blockly.IHasBubble {
  protected commentBubble: AnchoredComment;

  constructor(sourceBlock: Blockly.BlockSvg) {
    super(sourceBlock);

    this.commentBubble = new AnchoredComment(sourceBlock);
    // fire block_comment_create event
    // register listeners
  }

  override getType(): Blockly.icons.IconType<BlockCommentIcon> {
    return Blockly.icons.CommentIcon.TYPE;
  }

  override dispose() {
    super.dispose();
    this.commentBubble.dispose();
  }

  // Rendered at last
  override getWeight() {
    return -1;
  }

  // If comment has this icon, the bubble should always visible.
  override initView() {
    return;
  }

  override getSize(): Blockly.utils.Size {
    // Remove the built-in padding
    return new Blockly.utils.Size(-8, 0);
  }

  calculateAnchor(): Blockly.utils.Coordinate {
    const block = this.sourceBlock as Blockly.BlockSvg;
    const blockXY = block.getRelativeToSurfaceXY();
    const blockSize = block.getHeightWidth();
    const x = blockXY.x + blockSize.width;
    const y = blockXY.y + this.offsetInBlock.y;

    return new Blockly.utils.Coordinate(x, y);
  }

  override onLocationChange(blockOrigin: Blockly.utils.Coordinate) {
    super.onLocationChange(blockOrigin);
    const newAnchor = this.calculateAnchor();
    this.commentBubble.setAnchor(newAnchor);
  }

  bubbleIsVisible() {
    return true;
  }

  canBeFocused() {
    return false;
  }

  setBubbleVisible() {
    return Promise.resolve();
  }

  getBubble() {
    return this.commentBubble;
  }

  getText(): string {
    return this.commentBubble.getText();
  }

  setText(text: string): void {
    this.commentBubble.setText(text);
  }

  getBubbleSize(): Blockly.utils.Size {
    return this.commentBubble.getSize();
  }

  setBubbleSize(size: Blockly.utils.Size): void {
    this.commentBubble.setSize(size);
  }

  setBubbleLocation(location: Blockly.utils.Coordinate): void {
    this.commentBubble.moveTo(location);
  }

  getBubbleLocation() : Blockly.utils.Coordinate | undefined {
    return this.commentBubble.getRelativeToSurfaceXY();
  }

  saveState(): BlockCommentState {
    const size = this.commentBubble.getSize();
    const bubbleXY = this.commentBubble.getRelativeToSurfaceXY();
    return {
      text: this.commentBubble.getText(),
      width: size.width,
      height: size.height,
      x: bubbleXY.x,
      y: bubbleXY.y,
      collapsed: this.commentBubble.isCollapsed()
    };
  }

  loadState(state: BlockCommentState) {
    this.setText(state.text);
    this.setBubbleLocation(new Blockly.utils.Coordinate(state.x, state.y));
    this.setBubbleSize(new Blockly.utils.Size(state.width, state.height));
    this.commentBubble.setCollapsed(state.collapsed);
  }
}

// Replace the default comment icon with BlockCommentIcon
Blockly.registry.register(
  Blockly.registry.Type.ICON,
  Blockly.icons.IconType.COMMENT.toString(),
  BlockCommentIcon,
  true
);
