/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

export class AnchoredComment extends Blockly.comments.CommentView implements Blockly.IBubble, Blockly.ISelectable {
  sourceBlock: Blockly.BlockSvg;

  protected dragStartLocation?: Blockly.utils.Coordinate;
  protected chain: SVGPathElement;
  protected anchor?: Blockly.utils.Coordinate;
  protected relativeLeft: number = 50;
  protected relativeTop: number = 0;
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
    // Move chain to back so it doesn't overlap the bubble
    this.getSvgRoot().insertBefore(this.chain, this.getSvgRoot().firstChild);

    // Make comment view draggable
    Blockly.browserEvents.conditionalBind(
      this.getSvgRoot(),
      'pointerdown',
      this,
      this.startGesture
    );

    this.addTextChangeListener((oldText: string, newText: string) => {
      Blockly.Events.fire(
        new (Blockly.Events.get(Blockly.Events.BLOCK_CHANGE))(
          this.sourceBlock,
          'comment',
          null,
          oldText,
          newText
        )
      );
    });
    this.addSizeChangeListener((oldSize: Blockly.utils.Size, newSize: Blockly.utils.Size) => {
      Blockly.Events.fire(
        new (Blockly.Events.get('block_comment_resize'))(
          this,
          oldSize,
          newSize
        )
      );
    });

    Blockly.Events.fire(
      new (Blockly.Events.get('block_comment_create'))(this)
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

    this.chain.setAttribute('x1', '0');
    this.chain.setAttribute('y1', '0');
    this.chain.setAttribute('x2', offsetX.toString());
    this.chain.setAttribute('y2', offsetY.toString());
  }

  positionRelativeToAnchor() {
    if (!this.anchor) return;

    const left = this.relativeLeft + this.anchor.x;
    const top = this.relativeTop + this.anchor.y;
    this.moveTo(left, top);
  }

  startGesture(e: PointerEvent) {
    const gesture = this.workspace.getGesture(e);
    if (gesture) {
      gesture.handleBubbleStart(e, this);
      Blockly.common.setSelected(this);
    }
  }

  setDragging() {}

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

  moveTo(x: number, y: number): void;
  moveTo(newLoc: Blockly.utils.Coordinate): void;
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

    Blockly.Events.fire(
      new (Blockly.Events.get('block_comment_move'))(
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
      new (Blockly.Events.get('block_comment_move'))(
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

  getFocusableElement() {
    return this.getSvgRoot();
  }

  getFocusableTree() {
    return this.workspace;
  }

  onNodeFocus() {
    this.bringToFront();
  }

  onNodeBlur() { }

  select() { }
  unselect() { }

  canBeFocused() {
    return true;
  }

  dispose() {
    if (this.chain) {
      Blockly.utils.dom.removeNode(this.chain);
    }
    super.dispose();

    Blockly.Events.fire(
      new (Blockly.Events.get('block_comment_delete'))(
        this
      )
    );
  }
}
