/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

export class AnchoredComment extends Blockly.comments.CommentView implements Blockly.IBubble {
  protected sourceBlock: Blockly.BlockSvg;
  protected dragStartLocation?: Blockly.utils.Coordinate;
  protected chain: SVGPathElement;
  protected anchor?: Blockly.utils.Coordinate;

  // @todo inject css from these values?
  protected static readonly BORDER_WIDTH = 1;
  protected static readonly TOP_BAR_HEIGHT = 32;
  protected static readonly CHAIN_THICKNESS = 1;

  constructor(sourceBlock: Blockly.BlockSvg) {
    super(sourceBlock.workspace, sourceBlock.id);
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
  }

  /**
   * Set the anchor for the chain (where the chain connects to the block).
   * @param anchor The anchor coordinate.
   */
  setAnchor(anchor: Blockly.utils.Coordinate) {
    this.anchor = anchor;
    this.renderChain();
  }

  /**
   * Render the chain connecting the bubble to its anchor.
   * The chain connects from the bubble's topbar left-center to the anchor.
   */
  renderChain() {
    if (!this.chain || !this.anchor) return;

    const bubbleXY = this.getRelativeToSurfaceXY();
    const bubbleX = bubbleXY.x;
    const bubbleY = bubbleXY.y + AnchoredComment.TOP_BAR_HEIGHT / 2;

    const {x: anchorX, y: anchorY} = this.anchor;

    this.chain.setAttribute('x1', bubbleX.toString());
    this.chain.setAttribute('y1', bubbleY.toString());
    this.chain.setAttribute('x2', anchorX.toString());
    this.chain.setAttribute('y2', anchorY.toString());
  }

  setDragging() {}

  moveDuringDrag(newLoc: Blockly.utils.Coordinate) {
    this.moveTo(newLoc);
    this.renderChain();
  }

  isMovable() {
    return true;
  }

  moveTo(x: number, y: number): void;
  moveTo(newLoc: Blockly.utils.Coordinate): void;
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
    this.dragStartLocation = this.getRelativeToSurfaceXY();
    this.workspace.setResizesEnabled(false);

    this.workspace.getLayerManager()?.moveToDragLayer(this);

    // block's comment also seen as a part of block while dragging
    Blockly.utils.dom.addClass(this.getSvgRoot(), 'blocklyDragging');
  }

  drag(newLocation: Blockly.utils.Coordinate) {
    this.moveTo(newLocation);
  }

  endDrag() {
    this.workspace.setResizesEnabled(true);
    this.workspace.getLayerManager()?.moveOffDragLayer(this, Blockly.layers.BUBBLE);
    Blockly.utils.dom.removeClass(this.getSvgRoot(), 'blocklyDragging');
    // fire block_comment_move event
  }

  revertDrag() {
    if (this.dragStartLocation) {
      this.moveTo(this.dragStartLocation);
    }
  }

  setDeleteStyle() {}
  showContextMenu() {}

  getFocusableElement() {
    return this.getSvgRoot();
  }

  getFocusableTree() {
    return this.workspace;
  }

  onNodeFocus() { }

  onNodeBlur() { }

  canBeFocused() {
    return true;
  }

  dispose() {
    if (this.chain) {
      Blockly.utils.dom.removeNode(this.chain);
    }
    super.dispose();
  }
}
