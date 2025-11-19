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
export class BlockCommentIcon
  extends Blockly.icons.Icon
  implements Blockly.ISerializable, Blockly.IHasBubble, IInvisibleIcon
// eslint-disable-next-line brace-style
{
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
   * Internal state maintained by the icon.
   * This state is dispatched to the anchored comment when it's created.
   */
  protected state: BlockCommentState = {
    text: '',
    width: 200,
    height: 200,
    x: 0,
    y: 0,
    collapsed: false
  };
  /**
   * Constructor for a block comment icon.
   * @param sourceBlock The block this comment is attached to.
   */
  constructor(sourceBlock: Blockly.BlockSvg) {
    super(sourceBlock);
  }

  private onCommentTextChange(oldText: string, newText: string) {
    this.state.text = newText;
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
    if (!this.commentBubble) return;

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
    if (!this.commentBubble) return;

    this.state.collapsed = newCollapse;
    Blockly.Events.fire(
      new BlockCommentCollapse(
        this,
        newCollapse
      )
    );
  }

  private onCommentMove(oldCoordinate: Blockly.utils.Coordinate, newCoordinate: Blockly.utils.Coordinate) {
    if (!this.commentBubble) return;

    // Update state with relative position
    const anchor = this.calculateAnchor();
    const relativeXY = Blockly.utils.Coordinate.difference(newCoordinate, anchor);
    this.state.x = relativeXY.x;
    this.state.y = relativeXY.y;
    Blockly.Events.fire(
      new BlockCommentMove(
        this,
        oldCoordinate,
        newCoordinate
      )
    );
  }

  private onCommentDispose() {
    Blockly.Events.setGroup(true);
    if (!this.disposing) {
      this.sourceBlock.setCommentText(null);
    }

    if (this.commentBubble) {
      Blockly.Events.fire(
        new BlockCommentDelete(
          this
        )
      );
    }
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
    this.disposing = true;
    if (this.commentBubble && !this.commentBubble.isDeadOrDying()) {
      this.commentBubble.dispose();
    }

    super.dispose();
  }

  /**
   * Initializes the icon view and creates the anchored comment bubble.
   * Dispatches the maintained state to the newly created comment bubble.
   */
  override initView() {
    if (this.commentBubble) return;

    this.commentBubble = new AnchoredComment(this.sourceBlock as Blockly.BlockSvg);

    this.commentBubble.addTextChangeListener(this.onCommentTextChange.bind(this));
    this.commentBubble.addSizeChangeListener(this.onCommentSizeChange.bind(this));
    this.commentBubble.addOnCollapseListener(this.onCommentCollapse.bind(this));
    this.commentBubble.addMoveListener(this.onCommentMove.bind(this));
    this.commentBubble.addDisposeListener(this.onCommentDispose.bind(this));

    this.commentBubble.setText(this.state.text);
    this.commentBubble.setSize(new Blockly.utils.Size(this.state.width, this.state.height));
    this.commentBubble.setCollapsed(this.state.collapsed);

    // Set location if we have position data
    if (this.state.x !== 0 || this.state.y !== 0) {
      const anchor = this.calculateAnchor();
      const relativeXY = new Blockly.utils.Coordinate(this.state.x, this.state.y);
      const absoluteXY = Blockly.utils.Coordinate.sum(anchor, relativeXY);
      this.commentBubble.setPendingLocation(absoluteXY);
    }

    Blockly.Events.fire(
      new BlockCommentCreate(this)
    );
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
    const blockRect = block.rendered ? block.getBoundingRectangleWithoutChildren() : new Blockly.utils.Rect(0, 0, 0, 0);
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
    if (!this.commentBubble) return;

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
    return !!this.commentBubble;
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
    // Store relative position in state
    const anchor = this.calculateAnchor();
    const relativeXY = Blockly.utils.Coordinate.difference(location, anchor);
    this.state.x = relativeXY.x;
    this.state.y = relativeXY.y;

    this.commentBubble?.moveTo(location);
  }

  /**
   * Gets the current location of the comment bubble relative to the workspace surface.
   * @returns The coordinate of the bubble, or undefined if not available.
   */
  getBubbleLocation(): Blockly.utils.Coordinate | undefined {
    if (this.commentBubble) {
      return this.commentBubble.getRelativeToSurfaceXY();
    }

    // Calculate location from state if bubble doesn't exist yet
    const anchor = this.calculateAnchor();
    const relativeXY = new Blockly.utils.Coordinate(this.state.x, this.state.y);
    return Blockly.utils.Coordinate.sum(anchor, relativeXY);
  }

  /**
   * Saves the current state of the comment for serialization.
   * Implements ISerializable interface.
   * @returns An object containing all serializable state.
   */
  saveState(): BlockCommentState {
    return {...this.state};
  }

  /**
   * Loads a previously saved state to restore the comment.
   * Implements ISerializable interface.
   * @param state The saved state to restore.
   */
  loadState(state: BlockCommentState) {
    const oldState = this.saveState();
    this.state = {...state};

    Blockly.Events.setGroup(true);
    if (this.commentBubble) {
      this.commentBubble.setText(state.text);
      this.commentBubble.setSize(new Blockly.utils.Size(state.width, state.height));
      this.commentBubble.setCollapsed(state.collapsed);

      const anchor = this.calculateAnchor();
      const relativeXY = new Blockly.utils.Coordinate(state.x, state.y);
      const absoluteXY = Blockly.utils.Coordinate.sum(anchor, relativeXY);

      this.commentBubble.setPendingLocation(absoluteXY);

      if (this.commentBubble.hasAnchor()) {
        this.commentBubble.moveTo(absoluteXY);
        this.commentBubble.setPendingLocation(undefined);
      }
    } else {
      // Compares with old state to fire events properly
      if (oldState.text !== state.text) {
        this.sourceBlock.setCommentText(state.text);
        Blockly.Events.fire(
          new (Blockly.Events.get(Blockly.Events.BLOCK_CHANGE))(
            this.sourceBlock,
            'comment',
            null,
            oldState.text,
            state.text
          )
        );
      }

      if (oldState.width !== state.width || oldState.height !== state.height) {
        Blockly.Events.fire(
          new BlockCommentResize(
            this,
            new Blockly.utils.Size(oldState.width, oldState.height),
            new Blockly.utils.Size(state.width, state.height)
          )
        );
      }

      if (oldState.collapsed !== state.collapsed) {
        Blockly.Events.fire(
          new BlockCommentCollapse(
            this,
            state.collapsed
          )
        );
      }

      if (oldState.x !== state.x || oldState.y !== state.y) {
        const oldAnchor = this.calculateAnchor();
        const oldRelativeXY = new Blockly.utils.Coordinate(oldState.x, oldState.y);
        const oldAbsoluteXY = Blockly.utils.Coordinate.sum(oldAnchor, oldRelativeXY);

        const newAnchor = this.calculateAnchor();
        const newRelativeXY = new Blockly.utils.Coordinate(state.x, state.y);
        const newAbsoluteXY = Blockly.utils.Coordinate.sum(newAnchor, newRelativeXY);

        Blockly.Events.fire(
          new BlockCommentMove(
            this,
            oldAbsoluteXY,
            newAbsoluteXY
          )
        );
      }
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
