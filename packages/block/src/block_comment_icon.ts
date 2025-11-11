/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {AnchoredComment} from './anchored_comment';
import {BlockCommentCreate} from './events/block_comment_create';
import {BlockCommentResize} from './events/block_comment_resize';
import {BlockCommentCollapse} from './events/block_comment_collapse';
import {BlockCommentDelete} from './events/block_comment_delete';
import {BlockCommentMove} from './events/block_comment_move';

/**
 * State interface for block comment icon serialization.
 * Extends the base CommentState with additional positioning and size information.
 */
export interface BlockCommentState extends Blockly.icons.CommentState {
  text: string;
  height: number;
  width: number;
  x: number;
  y: number;
  collapsed: boolean;
}

/**
 * Class for a block comment icon.
 * This icon displays an anchored comment bubble that is always visible on the block.
 * Should implement Blockly.ICommentIcon, but seems it's not exported.
 */
export class BlockCommentIcon extends Blockly.icons.Icon implements Blockly.ISerializable, Blockly.IHasBubble {
  /**
   * The anchored comment bubble associated with this icon.
   */
  protected commentBubble: AnchoredComment;
  /**
   * Constructor for a block comment icon.
   * @param sourceBlock The block this comment is attached to.
   */
  constructor(sourceBlock: Blockly.BlockSvg) {
    super(sourceBlock);

    this.commentBubble = new AnchoredComment(sourceBlock);

    this.commentBubble.addTextChangeListener(this.onCommentTextChange.bind(this));
    this.commentBubble.addSizeChangeListener(this.onCommentSizeChange.bind(this));
    this.commentBubble.addOnCollapseListener(this.onCommentCollapse.bind(this));
    this.commentBubble.addMoveListener(this.onCommentMove.bind(this));
    this.commentBubble.addDisposeListener(this.onCommentDispose.bind(this));

    Blockly.Events.fire(
      new BlockCommentCreate(this.commentBubble)
    );
  }

  private onCommentTextChange(oldText: string, newText: string) {
    this.sourceBlock.setCommentText(newText);
    Blockly.Events.fire(
      new (Blockly.Events.get(Blockly.Events.BLOCK_CHANGE))(
        this.sourceBlock,
        'comment',
        null,
        oldText,
        newText
      )
    );
  }

  private onCommentSizeChange(oldSize: Blockly.utils.Size, newSize: Blockly.utils.Size) {
    Blockly.Events.fire(
      new BlockCommentResize(
        this.commentBubble,
        oldSize,
        newSize
      )
    );
  }

  private onCommentCollapse(newCollapse: boolean) {
    Blockly.Events.fire(
      new BlockCommentCollapse(
        this.commentBubble,
        newCollapse
      )
    );
  }

  private onCommentMove(oldCoordinate: Blockly.utils.Coordinate, newCoordinate: Blockly.utils.Coordinate) {
    Blockly.Events.fire(
      new BlockCommentMove(
        this.commentBubble,
        oldCoordinate,
        newCoordinate
      )
    );
  }

  private onCommentDispose() {
    Blockly.Events.setGroup(true);
    this.sourceBlock.setCommentText(null);

    Blockly.Events.fire(
      new BlockCommentDelete(
        this.commentBubble
      )
    );
    Blockly.Events.setGroup(false);
  }

  /**
   * Returns the type of this icon.
   * @returns The icon type for comment icons.
   */
  override getType(): Blockly.icons.IconType<BlockCommentIcon> {
    return Blockly.icons.CommentIcon.TYPE;
  }

  /**
   * Dispose of this icon and clean up the associated comment bubble.
   */
  override dispose() {
    if (!this.commentBubble.isDeadOrDying()) {
      this.commentBubble.dispose();
    }

    super.dispose();
  }

  /**
   * Initializes the icon view. No-op for block comment icon.
   */
  override initView() {
    return;
  }

  /**
   * Returns the size of the icon.
   * Block comment icons have no visual representation in the icon row.
   * @returns A size of (0, 0) since the comment is rendered outside the block.
   */
  override getSize(): Blockly.utils.Size {
    return new Blockly.utils.Size(0, 0);
  }

  /**
   * Calculates the anchor position for the comment bubble.
   * The anchor is positioned at the right edge of the block.
   * @returns The coordinate where the comment bubble should anchor.
   */
  calculateAnchor(): Blockly.utils.Coordinate {
    const block = this.sourceBlock as Blockly.BlockSvg;
    const blockRect = block.getBoundingRectangleWithoutChildren();
    const y = blockRect.top + this.offsetInBlock.y;
    const x = blockRect.right;

    return new Blockly.utils.Coordinate(x, y);
  }

  /**
   * Called when the icon's location changes (e.g., when the block moves).
   * Updates the comment bubble's anchor position.
   * @param blockOrigin The new origin coordinate of the block.
   */
  override onLocationChange(blockOrigin: Blockly.utils.Coordinate) {
    if (this.sourceBlock.isInsertionMarker()) {
      this.commentBubble.dispose();
      return;
    }

    super.onLocationChange(blockOrigin);
    const newAnchor = this.calculateAnchor();
    this.commentBubble.setAnchor(newAnchor);
  }

  /**
   * Checks if the bubble is currently visible.
   * For this icon type, the bubble is always visible.
   * @returns Always true since the anchored comment is always shown.
   */
  bubbleIsVisible() {
    return true;
  }

  /**
   * Determines if this bubble can receive focus.
   * @returns Always false since anchored comments cannot be focused.
   */
  canBeFocused() {
    return false;
  }

  /**
   * Sets the visibility of the bubble.
   * For this icon type, the visibility cannot be changed.
   * @returns A resolved promise indicating the operation is complete.
   */
  setBubbleVisible() {
    return Promise.resolve();
  }

  /**
   * Gets the bubble associated with this icon.
   * @returns The anchored comment bubble.
   */
  getBubble() {
    return this.commentBubble;
  }

  /**
   * Gets the text content of the comment.
   * @returns The comment text.
   */
  getText(): string {
    return this.commentBubble.getText();
  }

  /**
   * Sets the text content of the comment.
   * @param text The new comment text.
   */
  setText(text: string): void {
    this.commentBubble.setText(text);
  }

  /**
   * Gets the size of the comment bubble.
   * @returns The width and height of the bubble.
   */
  getBubbleSize(): Blockly.utils.Size {
    return this.commentBubble.getSize();
  }

  /**
   * Sets the size of the comment bubble.
   * @param size The new size for the bubble.
   */
  setBubbleSize(size: Blockly.utils.Size): void {
    this.commentBubble.setSize(size);
  }

  /**
   * Sets the collapsed state of the comment bubble.
   * @param collapsed Whether the bubble should be collapsed.
   */
  setCollapsed(collapsed: boolean): void {
    this.commentBubble.setCollapsed(collapsed);
  }

  /**
   * Gets the collapsed state of the comment bubble.
   * @returns True if the bubble is collapsed, false otherwise.
   */
  getCollapsed(): boolean {
    return this.commentBubble.isCollapsed();
  }

  /**
   * Sets the location of the comment bubble.
   * @param location The new coordinate for the bubble.
   */
  setBubbleLocation(location: Blockly.utils.Coordinate): void {
    this.commentBubble.moveTo(location);
  }

  /**
   * Gets the current location of the comment bubble relative to the workspace surface.
   * @returns The coordinate of the bubble, or undefined if not available.
   */
  getBubbleLocation() : Blockly.utils.Coordinate | undefined {
    return this.commentBubble.getRelativeToSurfaceXY();
  }

  /**
   * Saves the current state of the comment for serialization.
   * Implements ISerializable interface.
   * @returns An object containing all serializable state.
   */
  saveState(): BlockCommentState {
    const size = this.commentBubble.getSize();
    const bubbleXY = this.commentBubble.getRelativeToSurfaceXY();
    const anchor = this.calculateAnchor();
    const relativeXY = Blockly.utils.Coordinate.difference(
      bubbleXY,
      anchor
    );

    return {
      text: this.commentBubble.getText(),
      width: size.width,
      height: size.height,
      x: relativeXY.x,
      y: relativeXY.y,
      collapsed: this.commentBubble.isCollapsed()
    };
  }

  /**
   * Loads a previously saved state to restore the comment.
   * Implements ISerializable interface.
   * @param state The saved state to restore.
   */
  loadState(state: BlockCommentState) {
    Blockly.Events.setGroup(true);

    this.setText(state.text);
    this.setBubbleSize(new Blockly.utils.Size(state.width, state.height));
    this.setCollapsed(state.collapsed);

    const anchor = this.calculateAnchor();
    const relativeXY = new Blockly.utils.Coordinate(state.x, state.y);
    const absoluteXY = Blockly.utils.Coordinate.sum(anchor, relativeXY);

    this.commentBubble.setPendingLocation(absoluteXY);

    if (this.commentBubble.hasAnchor()) {
      this.setBubbleLocation(absoluteXY);
      this.commentBubble.setPendingLocation(undefined);
    }

    Blockly.Events.setGroup(false);
  }
}

// Replace the default comment icon with BlockCommentIcon
Blockly.registry.register(
  Blockly.registry.Type.ICON,
  Blockly.icons.IconType.COMMENT.toString(),
  BlockCommentIcon,
  true
);
