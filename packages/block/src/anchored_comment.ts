/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {BlockCommentMove} from './events/block_comment_move';
import {BlockCommentDelete} from './events/block_comment_delete';

export class AnchoredComment extends Blockly.comments.CommentView implements Blockly.IBubble, Blockly.ISelectable {
  sourceBlock: Blockly.BlockSvg | null;
  relativeLeft: number = 50;
  relativeTop: number = 0;

  protected dragStartLocation?: Blockly.utils.Coordinate;
  protected chain: SVGPathElement;
  protected anchor?: Blockly.utils.Coordinate;
  id: string;

  // @todo inject css from these values?
  protected static readonly BORDER_WIDTH = 1;
  protected static readonly TOP_BAR_HEIGHT = 32;
  protected static readonly CHAIN_THICKNESS = 1;

  private dragStrategy = new Blockly.dragging.BubbleDragStrategy(this, this.workspace);

  constructor(sourceBlock: Blockly.BlockSvg) {
    const id = `anchored_comment_${sourceBlock.id}`;
    super(sourceBlock.workspace, id);
    this.id = id;
    this.getSvgRoot().setAttribute('data-id', id);
    this.getSvgRoot().setAttribute('id', id);
    this.sourceBlock = sourceBlock;

    this.setPlaceholderText(Blockly.Msg.WORKSPACE_COMMENT_DEFAULT_TEXT);
    this.getSvgRoot().setAttribute(
      'style',
      `--commentBorderColour: ${sourceBlock.getColourTertiary()};`
    );

    this.chain = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.LINE,
      {
        class: 'anchoredCommentChain',
        'stroke-linecap': 'round',
        'stroke-width': AnchoredComment.CHAIN_THICKNESS,
        stroke: sourceBlock.getColourTertiary()
      },
      this.getSvgRoot()
    );
    this.chain.setAttribute('x1', '0');
    this.chain.setAttribute('y1', '0');
    // Move chain to back so it doesn't overlap the bubble
    this.getSvgRoot().insertBefore(this.chain, this.getSvgRoot().firstChild);

    // Make comment view draggable
    Blockly.browserEvents.conditionalBind(
      this.getSvgRoot(),
      'pointerdown',
      this,
      this.startGesture
    );
  }

  /**
   * Set the anchor for the chain (where the chain connects to the block).
   * @param anchor The anchor coordinate.
   */
  setAnchor(anchor: Blockly.utils.Coordinate) {
    this.anchor = anchor;
    this.positionRelativeToAnchor();
    this.renderChain();
  }

  /**
   * Render the chain connecting the bubble to its anchor.
   * The chain connects from the bubble's topbar left-center to the anchor.
   */
  renderChain() {
    if (!this.anchor) return;

    const bubbleXY = this.getRelativeToSurfaceXY();
    const bubbleX = bubbleXY.x;
    const bubbleY = bubbleXY.y + AnchoredComment.TOP_BAR_HEIGHT / 2;

    const {x: anchorX, y: anchorY} = this.anchor;
    const offsetX = anchorX - bubbleX;
    const offsetY = anchorY - bubbleY;

    this.chain.setAttribute('x2', offsetX.toString());
    this.chain.setAttribute('y2', offsetY.toString());
  }

  /**
   * Sets the position of this bubble relative to its anchor.
   * @param left The left position relative to the anchor.
   * @param top The top position relative to the anchor.
   */
  setPositionRelativeToAnchor(left: number, top: number) {
    this.relativeLeft = left;
    this.relativeTop = top;
    this.positionRelativeToAnchor();
    this.renderChain();
  }

  /** Positions the bubble relative to its anchor. Does not render its tail. */
  protected positionRelativeToAnchor() {
    if (!this.anchor) return;

    const left = this.relativeLeft + this.anchor.x;
    const top = this.relativeTop + this.anchor.y;
    this.moveTo(left, top);
  }

  /**
   * Start a drag gesture for this bubble. Used to make the bubble draggable.
   * @param e The pointer down event.
   * @internal
   */
  startGesture(e: PointerEvent) {
    const gesture = this.workspace.getGesture(e);
    if (gesture) {
      gesture.handleBubbleStart(e, this);
      Blockly.common.setSelected(this);
    }
  }

  setDragging() {}

  /**
   * Move this bubble during a drag.
   * @param newLoc The location to translate to, in workspace coordinates.
   * @internal
   */
  moveDuringDrag(newLoc: Blockly.utils.Coordinate) {
    this.moveTo(newLoc);

    if (this.anchor) {
      this.relativeTop = newLoc.y - this.anchor.y;
      this.relativeLeft = newLoc.x - this.anchor.x;
    }

    this.renderChain();
  }

  isMovable() {
    return true;
  }

  /**
   * Moves the anchored comment to the given coordinates.
   * @internal
   */
  moveTo(x: number, y: number): void;
  override moveTo(newLoc: Blockly.utils.Coordinate): void;
  moveTo(arg1: number | Blockly.utils.Coordinate, arg2?: number) {
    let coordinate: Blockly.utils.Coordinate;
    if (arg1 instanceof Blockly.utils.Coordinate) {
      coordinate = arg1;
    } else {
      coordinate = new Blockly.utils.Coordinate(arg1, arg2 as number);
    }

    const oldCoordinate = this.getRelativeToSurfaceXY();
    super.moveTo(coordinate);
    this.renderChain();

    if (!this.sourceBlock) return; // moveTo called during super constructor

    Blockly.Events.fire(
      new BlockCommentMove(
        this,
        oldCoordinate,
        coordinate
      )
    );
  }

  startDrag() {
    this.dragStrategy.startDrag();
  }

  drag(newLocation: Blockly.utils.Coordinate) {
    this.dragStrategy.drag(newLocation);
  }

  endDrag() {
    const oldCoordinate = this.getRelativeToSurfaceXY();
    this.dragStrategy.endDrag();

    Blockly.Events.fire(
      new BlockCommentMove(
        this,
        oldCoordinate,
        this.getRelativeToSurfaceXY()
      )
    );
  }

  revertDrag() {
    if (this.dragStartLocation) {
      this.moveTo(this.dragStartLocation);
    }
  }

  setDeleteStyle() {}
  showContextMenu() {}

  /**
   * See IFocusableNode.getFocusableElement.
   * @returns The element that can be focused.
   */
  getFocusableElement(): HTMLElement | SVGElement {
    return this.getSvgRoot();
  }

  /**
   * See IFocusableNode.getFocusableTree.
   * @returns The focusable tree (workspace).
   */
  getFocusableTree() {
    return this.workspace;
  }

  /** See IFocusableNode.onNodeFocus. */
  onNodeFocus() {
    this.bringToFront();
  }

  /** See IFocusableNode.onNodeBlur. */
  onNodeBlur() { }

  select() { }
  unselect() { }

  /**
   * See IFocusableNode.canBeFocused.
   * @returns Whether this node can be focused. always true for anchored comments.
   */
  canBeFocused() {
    return true;
  }

  override dispose() {
    this.disposing = true;
    if (this.chain) {
      Blockly.utils.dom.removeNode(this.chain);
    }

    if (this.sourceBlock) {
      const block = this.sourceBlock;
      this.sourceBlock = null; // Break recursive loop
      if (!block.isDeadOrDying()) {
        block.setCommentText(null);
      }
    }

    Blockly.Events.fire(
      new BlockCommentDelete(
        this
      )
    );

    super.dispose();
  }
}
