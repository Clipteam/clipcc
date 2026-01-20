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
import {IInvisibleIcon} from './interfaces/i_invisible_icon';

/**
 * State interface for block comment icon serialization.
 */
export interface BlockCommentState {
  id: string;
  text: string;
  height: number;
  width: number;
  x: number;
  y: number;
  collapsed: boolean;
}

/**
 * An icon which allows the user to add comment text to a block.
 * This icon displays an anchored comment bubble that is always visible on the block.
 * Should implement Blockly.ICommentIcon, but seems it's not exported.
 */
export class BlockCommentIcon
  extends Blockly.icons.Icon
  implements Blockly.ISerializable, Blockly.IHasBubble, IInvisibleIcon
// eslint-disable-next-line brace-style
{
  /** Default position relative to the anchor. */
  static readonly DEFAULT_BUBBLE_X_OFFSET = 40;
  static readonly DEFAULT_BUBBLE_Y_OFFSET = -AnchoredComment.TOP_BAR_HEIGHT / 2;

  /** Invisible icon with offsetInBlock. */
  invisible: boolean = true;

  /**
   * The anchored comment bubble associated with this icon.
   */
  protected commentBubble: AnchoredComment | null = null;

  /**
   * Whether this icon is currently being disposed or not.
   */
  protected disposing = false;

  /**
   * Whether use a default location for comment bubble.
   */
  protected useDefaultLocation = true;

  /**
   * Variables sed for fixing unexpected call to onLocationChange before the
   * block is rendered.
   * @todo These variables should be removed after issue is solved.
   */
  protected shouldAutoAdjust: boolean = true;
  protected rendered: boolean = false;

  /** The unique ID of the comment associated with this icon. */
  commentId: string;

  /**
   * Internal state maintained by the icon.
   * This state is dispatched to the anchored comment when it's created.
   */
  protected state: BlockCommentState = {
    id: '',
    text: '',
    width: AnchoredComment.defaultCommentSize.width,
    height: AnchoredComment.defaultCommentSize.height,
    x: 0,
    y: 0,
    collapsed: false
  };

  /**
   * @param sourceBlock The block this comment is attached to.
   */
  constructor(sourceBlock: Blockly.Block) {
    super(sourceBlock);
    this.state.id = (this.commentId = `anchored_comment_${this.sourceBlock.id}`);

    Blockly.Events.fire(new BlockCommentCreate(this));
  }

  private onCommentTextChange(oldText: string, newText: string) {
    if (newText === this.state.text) return;
    this.state.text = newText;

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
    if (newSize.width === this.state.width && newSize.height === this.state.height) return;
    this.state.width = newSize.width;
    this.state.height = newSize.height;

    Blockly.Events.fire(
      new BlockCommentResize(
        this,
        oldSize,
        newSize
      )
    );
  }

  private onCommentCollapse(newCollapse: boolean) {
    if (newCollapse === this.state.collapsed) return;
    this.state.collapsed = newCollapse;

    Blockly.Events.fire(
      new BlockCommentCollapse(
        this,
        newCollapse
      )
    );
  }

  private onCommentMove(oldCoordinate: Blockly.utils.Coordinate, newCoordinate: Blockly.utils.Coordinate) {
    if (newCoordinate.x === this.state.x && newCoordinate.y === this.state.y) return;
    this.state.x = newCoordinate.x;
    this.state.y = newCoordinate.y;

    Blockly.Events.fire(
      new BlockCommentMove(
        this,
        oldCoordinate,
        newCoordinate
      )
    );
  }

  private onCommentDispose() {
    if (!this.disposing) {
      this.sourceBlock.setCommentText(null);
    }
  }

  /** Keeps the serialized state aligned with the bubble's rendered position. */
  private syncBubbleLocationState() {
    if (!this.commentBubble) return;
    const location = this.commentBubble.getRelativeToSurfaceXY();
    this.state.x = location.x;
    this.state.y = location.y;
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
    this.disposing = true;

    Blockly.Events.fire(new BlockCommentDelete(this));

    if (this.commentBubble && !this.commentBubble.isDeadOrDying()) {
      this.commentBubble.dispose();
      this.commentBubble = null;
    }

    super.dispose();
  }

  /**
   * Initializes the icon view and creates the anchored comment bubble.
   * Dispatches the maintained state to the newly created comment bubble.
   * @param pointerdownListener An event listener that must be attached to the
   *     root SVG element by the implementation of `initView`.
   */
  override initView(pointerdownListener: (e: PointerEvent) => void): void {
    if (this.commentBubble) return;

    this.commentBubble = new AnchoredComment(this.sourceBlock as Blockly.BlockSvg, this.commentId);

    this.commentBubble.setText(this.state.text);
    this.commentBubble.setSize(new Blockly.utils.Size(this.state.width, this.state.height));
    this.commentBubble.setCollapsed(this.state.collapsed);
    this.commentBubble.moveTo(this.state.x, this.state.y);

    this.commentBubble.addTextChangeListener(this.onCommentTextChange.bind(this));
    this.commentBubble.addSizeChangeListener(this.onCommentSizeChange.bind(this));
    this.commentBubble.addOnCollapseListener(this.onCommentCollapse.bind(this));
    this.commentBubble.addMoveListener(this.onCommentMove.bind(this));
    this.commentBubble.addDisposeListener(this.onCommentDispose.bind(this));
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
   * Get the anchor position for the comment bubble. The anchor is at the middle
   * of block's right (or left if RTL) side.
   * @returns The coordinate where the comment bubble should anchor.
   */
  protected getAnchor(): Blockly.utils.Coordinate {
    if (!this.sourceBlock.rendered) {
      throw new Error('Calling getAnchor() in a headless workspace.');
    }

    const blockRect = (this.sourceBlock as Blockly.BlockSvg).getBoundingRectangleWithoutChildren();
    return new Blockly.utils.Coordinate(
      this.sourceBlock.RTL ? blockRect.left : blockRect.right,
      blockRect.top + this.offsetInBlock.y
    );
  }

  /**
   * Notifies the icon where it is relative to its block's top-start, in
   * workspace units.
   * @todo Remove this after solving the unexpected call to onLocationChange.
   * @param offset The offset in block.
   */
  override setOffsetInBlock(offset: Blockly.utils.Coordinate): void {
    super.setOffsetInBlock(offset);
    if (!this.rendered) {
      this.rendered = true;
      this.shouldAutoAdjust = false;
    }
  }

  /**
   * Called when the icon's location changes (e.g., when the block moves).
   * Updates the comment bubble's anchor position.
   * @param blockOrigin The new origin coordinate of the block.
   */
  override onLocationChange(blockOrigin: Blockly.utils.Coordinate) {
    if (!this.commentBubble) return;

    if (this.sourceBlock.isInsertionMarker()) {
      this.commentBubble.dispose();
      return;
    }

    super.onLocationChange(blockOrigin);

    const anchor = this.getAnchor();
    if (this.useDefaultLocation) {
      this.setBubbleLocation(new Blockly.utils.Coordinate(
        anchor.x + BlockCommentIcon.DEFAULT_BUBBLE_X_OFFSET * (this.sourceBlock.RTL ? -1 : 1),
        anchor.y + BlockCommentIcon.DEFAULT_BUBBLE_Y_OFFSET
      ));
    }
    this.commentBubble.setAnchor(anchor, this.shouldAutoAdjust);
    if (this.shouldAutoAdjust) {
      this.syncBubbleLocationState();
    }
    if (!this.shouldAutoAdjust) {
      this.shouldAutoAdjust = true;
      const location = this.commentBubble.getRelativeToSurfaceXY();
      Blockly.Events.fire(
        new BlockCommentMove(
          this,
          location,
          location
        )
      );
    }
  }

  /**
   * Checks if the bubble is currently visible.
   * For this icon type, the bubble is always visible.
   * @returns Always true since the anchored comment is always shown.
   */
  bubbleIsVisible() {
    return !!this.commentBubble;
  }

  /**
   * Determines if this bubble can receive focus.
   * @returns Always false since anchored comments cannot be focused.
   */
  override canBeFocused() {
    return false;
  }

  /**
   * Sets the visibility of the bubble.
   * For this icon type, the visibility cannot be changed.
   * @returns A resolved promise indicating the operation is complete.
   */
  async setBubbleVisible() {
    return;
  }

  /**
   * Gets the bubble associated with this icon.
   * @returns The anchored comment bubble, or null.
   */
  getBubble() {
    return this.commentBubble;
  }

  /**
   * Gets the text content of the comment.
   * @returns The comment text.
   */
  getText(): string {
    return this.state.text;
  }

  /**
   * Sets the text content of the comment.
   * @param text The new comment text.
   */
  setText(text: string): void {
    this.state.text = text;
    this.commentBubble?.setText(text);
  }

  /**
   * Gets the size of the comment bubble.
   * @returns The width and height of the bubble.
   */
  getBubbleSize(): Blockly.utils.Size {
    return new Blockly.utils.Size(this.state.width, this.state.height);
  }

  /**
   * Sets the size of the comment bubble.
   * @param size The new size for the bubble.
   */
  setBubbleSize(size: Blockly.utils.Size): void {
    this.state.width = size.width;
    this.state.height = size.height;
    this.commentBubble?.setSize(size);
  }

  /**
   * Sets the collapsed state of the comment bubble.
   * @param collapsed Whether the bubble should be collapsed.
   */
  setCollapsed(collapsed: boolean): void {
    this.state.collapsed = collapsed;
    this.commentBubble?.setCollapsed(collapsed);
  }

  /**
   * Gets the collapsed state of the comment bubble.
   * @returns True if the bubble is collapsed, false otherwise.
   */
  getCollapsed(): boolean {
    return this.state.collapsed;
  }

  /**
   * Sets the location of the comment bubble.
   * @param location The new coordinate for the bubble.
   */
  setBubbleLocation(location: Blockly.utils.Coordinate): void {
    this.useDefaultLocation = false;
    this.state.x = location.x;
    this.state.y = location.y;
    this.commentBubble?.moveToWithFiringEvents(location);
  }

  /**
   * Gets the current location of the comment bubble relative to the workspace surface.
   * @returns The coordinate of the bubble, or undefined if not available.
   */
  getBubbleLocation(): Blockly.utils.Coordinate | undefined {
    return new Blockly.utils.Coordinate(this.state.x, this.state.y);
  }

  /**
   * Saves the current state of the comment for serialization.
   * Implements ISerializable interface.
   * @returns An object containing all serializable state.
   */
  saveState(): BlockCommentState {
    return Object.assign({}, this.state);
  }

  /**
   * Loads a previously saved state to restore the comment.
   * Implements ISerializable interface.
   * @param state The saved state to restore.
   */
  loadState(state: BlockCommentState) {
    this.useDefaultLocation = false;
    const oldState = this.saveState();

    Blockly.Events.setGroup(true);
    if (this.commentBubble) {
      this.commentBubble.setText(state.text);
      this.commentBubble.setSize(new Blockly.utils.Size(state.width, state.height));
      this.commentBubble.setCollapsed(state.collapsed);
      this.commentBubble.moveToWithFiringEvents(new Blockly.utils.Coordinate(state.x, state.y));
    } else {
      this.onCommentTextChange(oldState.text, state.text);
      this.onCommentSizeChange(
        new Blockly.utils.Size(oldState.width, oldState.height),
        new Blockly.utils.Size(state.width, state.height)
      );
      this.onCommentCollapse(state.collapsed);
      this.onCommentMove(
        new Blockly.utils.Coordinate(oldState.x, oldState.y),
        new Blockly.utils.Coordinate(state.x, state.y)
      );
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
