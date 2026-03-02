/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Comment anchored to a block.
 */
export class AnchoredComment
  extends Blockly.comments.CommentView
  implements Blockly.IBubble, Blockly.ISelectable, Blockly.IBoundedElement {
  sourceBlock: Blockly.BlockSvg | null;
  id: string;

  /**
   * The location where a drag started. Used to revert drag and fire move event.
   */
  protected dragStartLocation?: Blockly.utils.Coordinate;

  protected chain: SVGPathElement;

  protected anchor: Blockly.utils.Coordinate | null = null;

  // @todo inject css from these values?
  protected static readonly BORDER_WIDTH = 1;
  static readonly TOP_BAR_HEIGHT = 32;
  protected static readonly CHAIN_THICKNESS = 1;

  private dragStrategy = new Blockly.dragging.BubbleDragStrategy(this, this.workspace);
  private moveListener: Array<
    (oldCoordinate: Blockly.utils.Coordinate, newCoordinate: Blockly.utils.Coordinate) => void
  > = [];

  /**
   * @param sourceBlock The block this comment is attached to.
   * @param id The unique ID of this comment.
   */
  constructor(sourceBlock: Blockly.BlockSvg, id: string) {
    super(sourceBlock.workspace, id);
    this.id = id;
    this.sourceBlock = sourceBlock;

    this.getSvgRoot().setAttribute('data-id', this.id);
    this.getSvgRoot().setAttribute('id', this.id);

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
   * @param adjustPosition True if the comment position should be automatically
   *      adjusted to keep the relative coordinate.
   * @
   */
  setAnchor(anchor: Blockly.utils.Coordinate, adjustPosition: boolean = true) {
    const oldAnchor = this.anchor;
    this.anchor = anchor;

    if (oldAnchor && adjustPosition) {
      const oldLocation = this.getRelativeToSurfaceXY();
      const delta = Blockly.utils.Coordinate.difference(this.anchor, oldAnchor);
      const newLocation = Blockly.utils.Coordinate.sum(oldLocation, delta);
      this.moveTo(newLocation);
    } else {
      this.renderChain();
    }
  }

  /**
   * Checks if the anchor has been set.
   * @returns True if anchor exists.
   */
  hasAnchor(): boolean {
    return !!this.anchor;
  }

  /**
   * Render the chain connecting the bubble to its anchor.
   * The chain connects from the anchor to the bubble's top-center.
   */
  protected renderChain() {
    if (!this.anchor) return;

    const location = this.getRelativeToSurfaceXY();
    const bubbleWidth = this.getSize().width;

    this.chain.setAttribute('x1', (this.anchor.x - location.x).toString());
    this.chain.setAttribute('y1', (this.anchor.y - location.y).toString());
    this.chain.setAttribute('x2', (bubbleWidth / 2).toString());
    this.chain.setAttribute('y2', (AnchoredComment.TOP_BAR_HEIGHT / 2).toString());
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

  setDragging(dragging: boolean) {}

  /**
   * Move this bubble during a drag.
   * @param newLoc The location to translate to, in workspace coordinates.
   * @internal
   */
  moveDuringDrag(newLoc: Blockly.utils.Coordinate) {
    this.moveTo(newLoc);
  }

  /**
   * Returns whether this bubble is movable. Always true for anchored comments.
   * @returns true
   */
  isMovable() {
    return true;
  }

  /**
   * Moves the anchored comment to the given coordinates.
   * @internal
   */
  override moveTo(x: number, y: number): void;
  override moveTo(newLoc: Blockly.utils.Coordinate): void;
  override moveTo(arg1: number | Blockly.utils.Coordinate, arg2?: number) {
    let coordinate: Blockly.utils.Coordinate;
    if (arg1 instanceof Blockly.utils.Coordinate) {
      coordinate = arg1;
    } else {
      coordinate = new Blockly.utils.Coordinate(arg1, arg2 as number);
    }

    super.moveTo(coordinate);
    this.renderChain();
  }

  moveToWithFiringEvents(newLoc: Blockly.utils.Coordinate): void {
    const oldLoc = this.getRelativeToSurfaceXY();
    this.moveTo(newLoc);
    this.onMove(oldLoc, newLoc);
  }

  /**
   * Move the element by a relative offset.
   * See IBoundedElement.moveBy.
   * @param dx Horizontal offset in workspace units.
   * @param dy Vertical offset in workspace units.
   */
  moveBy(dx: number, dy: number): void {
    const oldLocation = this.getRelativeToSurfaceXY();
    const newLocation = new Blockly.utils.Coordinate(
      oldLocation.x + dx,
      oldLocation.y + dy
    );
    this.moveTo(newLocation);
  }

  /**
   * Sets the size of the comment in workspace units without firing events.
   * updates the view elements to reflect the new size, and triggers size change listeners.
   * @param size The new size.
   */
  override setSizeWithoutFiringEvents(size: Blockly.utils.Size): void {
    super.setSizeWithoutFiringEvents(size);
    this.renderChain();
  }

  startDrag() {
    this.dragStrategy.startDrag();
    this.dragStartLocation = this.getRelativeToSurfaceXY(); // dragStrategy.startLoc is private
  }

  /**
   * Handles moving elements to the new location, and updating any
   * visuals based on that (e.g connection previews for blocks).
   * @param newLocation Workspace coordinate to which the draggable has
   */
  drag(newLocation: Blockly.utils.Coordinate) {
    this.dragStrategy.drag(newLocation);
  }

  /**
   * Registers a callback that listens for anchored comment moving.
   * @param listener The callback function.
   */
  addMoveListener(listener: (
    oldCoordinate: Blockly.utils.Coordinate,
    newCoordinate: Blockly.utils.Coordinate
    ) => void
  ) {
    this.moveListener.push(listener);
  }

  /**
   * Removes the given listener from the comment editor.
   * @param listener The callback function to remove.
   */
  removeMoveListener(listener: () => void) {
    this.moveListener.splice(
      this.moveListener.indexOf(listener),
      1
    );
  };

  /**
   * Triggers listeners when the position of the comment changes, either
   * programmatically or manually by the user.
   * @param oldCoordinate The old coordinate.
   * @param newCoordinate The new coordinate.
   */
  private onMove(oldCoordinate: Blockly.utils.Coordinate, newCoordinate: Blockly.utils.Coordinate) {
    if (!this.moveListener) {
      // Current instance is not constructed.
      return;
    }
    for (let i = this.moveListener.length - 1; i >= 0; i--) {
      this.moveListener[i](oldCoordinate, newCoordinate);
    }
  }

  /**
   * Handles any drag cleanup, including e.g. connecting or deleting
   * blocks.
   */
  endDrag() {
    const coordinate = this.getRelativeToSurfaceXY();
    this.dragStrategy.endDrag();
    this.onMove(this.dragStartLocation!, coordinate);
  }

  /** Moves the draggable back to where it was at the start of the drag. */
  revertDrag() {
    if (this.dragStartLocation) {
      this.moveTo(this.dragStartLocation);
    }
  }

  setDeleteStyle(enable: boolean) {}
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
  onNodeBlur() {}

  /** See ISelectable.select. */
  select() {}

  /** See ISelectable.unselect. */
  unselect() {}

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

    super.dispose();
  }

  /**
   * See IBoundedElement.getBoundingRectangle.
   * @returns Object with coordinates of the bounded element.
   */
  getBoundingRectangle(): Blockly.utils.Rect {
    const location = this.getRelativeToSurfaceXY();
    const size = this.getSize();
    return new Blockly.utils.Rect(
      location.y,
      location.y + size.height,
      location.x,
      location.x + size.width
    );
  }
}
