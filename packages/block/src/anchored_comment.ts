/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

export class AnchoredComment extends Blockly.comments.CommentView implements Blockly.IBubble, Blockly.ISelectable {
  sourceBlock: Blockly.BlockSvg | null;
  id: string;

  /**
   * The location where a drag started. Used to revert drag and fire move event.
   */
  protected dragStartLocation?: Blockly.utils.Coordinate;
  protected chain: SVGPathElement;
  protected anchor?: Blockly.utils.Coordinate;
  /**
   * Whether the comment position should be automatically adjusted
   * when the anchor changes. Set to false during state restoration.
   */
  protected autoAdjustPosition = true;
  /**
   * Pending location to be applied when anchor is set.
   * Used during state restoration when location is set before anchor.
   */
  protected pendingLocation?: Blockly.utils.Coordinate;

  // @todo inject css from these values?
  protected static readonly BORDER_WIDTH = 1;
  protected static readonly TOP_BAR_HEIGHT = 32;
  protected static readonly CHAIN_THICKNESS = 1;

  private dragStrategy = new Blockly.dragging.BubbleDragStrategy(this, this.workspace);
  private moveListener: Array<
    (oldCoordinate: Blockly.utils.Coordinate, newCoordinate: Blockly.utils.Coordinate) => void
  > = [];

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
    const oldAnchor = this.anchor;
    const hasAnchored = !!this.anchor;
    this.anchor = anchor;

    if (!hasAnchored) {
      // If there's a pending location from loadState, use it instead of initAnchor
      if (this.pendingLocation) {
        this.moveTo(this.pendingLocation);
        this.pendingLocation = undefined;
      } else {
        // position bubble relative to anchor at first
        this.initAnchor();
      }
    } else if (oldAnchor && this.autoAdjustPosition) {
      const oldLocation = this.getRelativeToSurfaceXY();
      const delta = Blockly.utils.Coordinate.difference(this.anchor, oldAnchor);
      const newLocation = Blockly.utils.Coordinate.sum(oldLocation, delta);
      this.moveTo(newLocation);
    }
  }

  /**
   * Sets a pending location to be applied when anchor is set.
   * Used during state restoration.
   * @param location The location to apply when anchor is set.
   */
  setPendingLocation(location: Blockly.utils.Coordinate | undefined) {
    this.pendingLocation = location;
  }

  /**
   * Checks if the anchor has been set.
   * @returns True if anchor exists.
   */
  hasAnchor(): boolean {
    return !!this.anchor;
  }

  /**
   * Initialize the bubble position at first.
   */
  protected initAnchor() {
    if (!this.anchor) return;

    const verticalOffset = AnchoredComment.TOP_BAR_HEIGHT / 2;
    const horizontalOffset = 40;

    this.moveTo(
      this.anchor.x + horizontalOffset * (this.workspace.RTL ? -1 : 1),
      this.anchor.y - verticalOffset
    );
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

  setDragging() {}

  /**
   * Move this bubble during a drag.
   * @param newLoc The location to translate to, in workspace coordinates.
   * @internal
   */
  moveDuringDrag(newLoc: Blockly.utils.Coordinate) {
    this.moveTo(newLoc);
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

    super.moveTo(coordinate);
    this.renderChain();
  }

  startDrag() {
    this.dragStrategy.startDrag();
    this.dragStartLocation = this.getRelativeToSurfaceXY(); // dragStategy.startLoc is private
  }

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

  endDrag() {
    const coordinate = this.getRelativeToSurfaceXY();
    this.dragStrategy.endDrag();

    for (let i = this.moveListener.length - 1; i >= 0; i--) {
      this.moveListener[i](this.dragStartLocation!, coordinate);
    }
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

    super.dispose();
  }
}
