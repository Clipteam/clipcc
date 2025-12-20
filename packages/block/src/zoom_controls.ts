/**
 * @license
 * Copyright 2015 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Interface for zoom controls.
 * Should keep up with Blockly.ZoomControls's public fields.
 */
export interface IZoomControls extends Blockly.IPositionable {
  /**
   * The unique ID for this component that is used to register with the
   * ComponentManager.
   */
  id: string;

  /**
   * Create the zoom controls.
   * @returns The zoom controls SVG group.
   */
  createDom(): SVGElement;

  /**
   * Initializes the zoom controls.
   */
  init(): void;

  /**
   * Disposes of this zoom controls.
   * Unlink from all DOM elements to prevent memory leaks.
   */
  dispose(): void;

  /**
   * Returns the bounding rectangle of the UI element in pixel units relative to
   * the Blockly injection div.
   * @returns The UI elements's bounding box. Null if bounding box should be
   *     ignored by other UI elements.
   */
  getBoundingRectangle(): Blockly.utils.Rect | null;

  /**
   * Positions the zoom controls.
   * It is positioned in the opposite corner to the corner the
   * categories/toolbox starts at.
   * @param metrics The workspace metrics.
   * @param savedPositions List of rectangles that are already on the workspace.
   */
  position(metrics: Blockly.MetricsManager.UiMetrics, savedPositions: Blockly.utils.Rect[]): void;
}

/**
 * Class for zoom controls.
 * Copied from Blockly.ZoomControls and make it Scratch-styled.
 */
export class ZoomControls implements IZoomControls {
  static readonly XLINK_NS = 'http://www.w3.org/1999/xlink';
  /**
   * The unique ID for this component that is used to register with the
   * ComponentManager.
   */
  id = 'zoomControls';

  /**
   * Array holding info needed to unbind events.
   * Used for disposing.
   * Ex: [[node, name, func], [node, name, func]].
   */
  private boundEvents: Blockly.browserEvents.Data[] = [];

  /** The zoom in svg <g> element. */
  private zoomInGroup: SVGGElement | null = null;

  /** The zoom out svg <g> element. */
  private zoomOutGroup: SVGGElement | null = null;

  /** The zoom reset svg <g> element. */
  private zoomResetGroup: SVGGElement | null = null;

  private readonly ICON_SIZE = 36;
  private readonly ICON_SPACING = 8;
  private readonly ICON_MARGIN = 12;
  private readonly TOTAL_HEIGHT =
    this.ICON_SIZE * 3 + this.ICON_SPACING * 2;

  /**
   * Zoom in icon path.
   */
  private readonly ZOOM_IN_PATH_ = 'zoom-in.svg';

  /**
   * Zoom out icon path.
   */
  private readonly ZOOM_OUT_PATH_ = 'zoom-out.svg';

  /**
   * Zoom reset icon path.
   */
  private readonly ZOOM_RESET_PATH_ = 'zoom-reset.svg';

  /** The SVG group containing the zoom controls. */
  private svgGroup: SVGElement | null = null;

  /** Left coordinate of the zoom controls. */
  private left = 0;

  /** Top coordinate of the zoom controls. */
  private top = 0;

  /** Whether this has been initialized. */
  private initialized = false;

  /** @param workspace The workspace to sit in. */
  constructor(private readonly workspace: Blockly.WorkspaceSvg) { }

  /**
   * Create the zoom controls.
   * @returns The zoom controls SVG group.
   */
  createDom(): SVGElement {
    this.svgGroup = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.G, {});

    // Each filter/pattern needs a unique ID for the case of multiple Blockly
    // instances on a page.  Browser behaviour becomes undefined otherwise.
    // https://neil.fraser.name/news/2015/11/01/
    const rnd = String(Math.random()).substring(2);
    this.createZoomOutSvg(rnd);
    this.createZoomInSvg(rnd);
    if (this.workspace.isMovable()) {
      // If we zoom to the center and the workspace isn't movable we could
      // lose blocks at the edges of the workspace.
      this.createZoomResetSvg(rnd);
    }
    return this.svgGroup;
  }

  /** Initializes the zoom controls. */
  init() {
    this.workspace.getComponentManager().addComponent({
      component: this,
      weight: Blockly.ComponentManager.ComponentWeight.ZOOM_CONTROLS_WEIGHT,
      capabilities: [Blockly.ComponentManager.Capability.POSITIONABLE]
    });
    this.initialized = true;
  }

  /**
   * Disposes of this zoom controls.
   * Unlink from all DOM elements to prevent memory leaks.
   */
  dispose() {
    this.workspace.getComponentManager().removeComponent('zoomControls');
    if (this.svgGroup) {
      Blockly.utils.dom.removeNode(this.svgGroup);
    }
    for (const event of this.boundEvents) {
      Blockly.browserEvents.unbind(event);
    }
    this.boundEvents.length = 0;
  }

  /**
   * Returns the bounding rectangle of the UI element in pixel units relative to
   * the Blockly injection div.
   * @returns The UI elements's bounding box. Null if bounding box should be
   *     ignored by other UI elements.
   */
  getBoundingRectangle(): Blockly.utils.Rect | null {
    let height = this.ICON_SPACING + 2 * this.ICON_SIZE;
    if (this.zoomResetGroup) {
      height += this.ICON_SPACING + this.ICON_SIZE;
    }
    const bottom = this.top + height;
    const right = this.left + this.ICON_SIZE;
    return new Blockly.utils.Rect(this.top, bottom, this.left, right);
  }

  /**
   * Positions the zoom controls.
   * use Scratch-style ordering: zoom-in, zoom-out, reset (top to bottom).
   * @param metrics The workspace metrics.
   * @param savedPositions List of rectangles that are already on the workspace.
   */
  position(
    metrics: Blockly.MetricsManager.UiMetrics,
    savedPositions: Blockly.utils.Rect[]
  ): void {
    // Not yet initialized.
    if (!this.initialized) {
      return;
    }

    const cornerPosition =
      Blockly.uiPosition.getCornerOppositeToolbox(
        this.workspace,
        metrics
      );

    const startRect = Blockly.uiPosition.getStartPositionRect(
      cornerPosition,
      new Blockly.utils.Size(this.ICON_SIZE, this.TOTAL_HEIGHT),
      this.ICON_MARGIN,
      this.ICON_MARGIN,
      metrics,
      this.workspace
    );

    const verticalPosition = cornerPosition.vertical;
    const bumpDirection =
      verticalPosition === Blockly.uiPosition.verticalPosition.TOP ?
        Blockly.uiPosition.bumpDirection.DOWN :
        Blockly.uiPosition.bumpDirection.UP;
    const positionRect = Blockly.uiPosition.bumpPositionRect(
      startRect,
      this.ICON_MARGIN,
      bumpDirection,
      savedPositions
    );

    // Position is always the same regardless of vertical position
    this.zoomInGroup?.setAttribute('transform', 'translate(0, 0)');
    this.zoomOutGroup?.setAttribute(
      'transform',
      `translate(0, ${this.ICON_SIZE + this.ICON_SPACING})`
    );
    this.zoomResetGroup?.setAttribute(
      'transform',
      `translate(0, ${(this.ICON_SIZE + this.ICON_SPACING) * 2})`
    );

    this.top = positionRect.top;
    this.left = positionRect.left;
    this.svgGroup?.setAttribute(
      'transform',
      `translate(${this.left}, ${this.top})`
    );
  }

  /**
   * Appends an icon image to the parent SVG group.
   * @param parent The parent SVG group element to append the icon to.
   * @param fileName The file name of the icon image.
   */
  private appendIcon_(parent: SVGGElement | null, fileName: string) {
    if (!parent) return;
    const image = Blockly.utils.dom.createSvgElement(
      'image',
      {
        width: this.ICON_SIZE,
        height: this.ICON_SIZE
      },
      parent
    );
    image.setAttributeNS(
      ZoomControls.XLINK_NS,
      'xlink:href',
      this.workspace.options.pathToMedia + fileName
    );
  }

  /**
   * Create the zoom out icon and its event handler.
   * The Scratch Blocks implementation of this function is different from the
   * Blockly implementation.
   * @param _rnd The random string to use as a suffix in the clip path's ID.
   *     These IDs must be unique in case there are multiple Blockly instances
   *     on the same page.
   */
  protected createZoomOutSvg(_rnd: string): void {
    if (!this.svgGroup) return;
    this.zoomOutGroup = Blockly.utils.dom.createSvgElement(
      'g',
      {class: 'blocklyZoom blocklyZoomOut'},
      this.svgGroup
    ) as SVGGElement;
    const zoomOutGroup = this.zoomOutGroup;
    if (!zoomOutGroup) return;
    this.appendIcon_(zoomOutGroup, this.ZOOM_OUT_PATH_);
    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        zoomOutGroup,
        'pointerdown',
        null,
        this.zoom.bind(this, -1)
      )
    );
  }

  /**
   * Create the zoom in icon and its event handler.
   * The Scratch Blocks implementation of this function is different from the
   * Blockly implementation.
   * @param _rnd The random string to use as a suffix in the clip path's ID.
   *     These IDs must be unique in case there are multiple Blockly instances
   *     on the same page.
   */
  protected createZoomInSvg(_rnd: string): void {
    if (!this.svgGroup) return;
    this.zoomInGroup = Blockly.utils.dom.createSvgElement(
      'g',
      {class: 'blocklyZoom blocklyZoomIn'},
      this.svgGroup
    ) as SVGGElement;
    const zoomInGroup = this.zoomInGroup;
    if (!zoomInGroup) return;
    this.appendIcon_(zoomInGroup, this.ZOOM_IN_PATH_);
    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        zoomInGroup,
        'pointerdown',
        null,
        this.zoom.bind(this, 1)
      )
    );
  }

  /**
   * Handles a mouse down event on the zoom in or zoom out buttons on the
   * workspace.
   * @param amount Amount of zooming. Negative amount values zoom out, and
   *     positive amount values zoom in.
   * @param e A mouse down event.
   */
  protected zoom(amount: number, e: PointerEvent) {
    this.workspace.markFocused();
    this.workspace.zoomCenter(amount);
    this.fireZoomEvent();
    Blockly.Touch.clearTouchIdentifier(); // Don't block future drags.
    e.stopPropagation(); // Don't start a workspace scroll.
    e.preventDefault(); // Stop double-clicking from selecting text.
  }

  /**
   * Create the zoom reset icon and its event handler.
   * The Scratch Blocks implementation of this function is different from the
   * Blockly implementation.
   * @param _rnd The random string to use as a suffix in the clip path's ID.
   */
  protected createZoomResetSvg(_rnd: string): void {
    if (!this.svgGroup) return;
    this.zoomResetGroup = Blockly.utils.dom.createSvgElement(
      'g',
      {class: 'blocklyZoom blocklyZoomReset'},
      this.svgGroup
    ) as SVGGElement;
    const zoomResetGroup = this.zoomResetGroup;
    if (!zoomResetGroup) return;
    this.appendIcon_(zoomResetGroup, this.ZOOM_RESET_PATH_);
    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        zoomResetGroup,
        'pointerdown',
        null,
        this.resetZoom.bind(this)
      )
    );
  }

  /**
   * Handles a mouse down event on the reset zoom button on the workspace.
   * @param e A mouse down event.
   */
  protected resetZoom(e: PointerEvent) {
    this.workspace.markFocused();

    // zoom is passed amount and computes the new scale using the formula:
    // targetScale = currentScale * Math.pow(speed, amount)
    const targetScale = this.workspace.options.zoomOptions.startScale;
    const currentScale = this.workspace.scale;
    const speed = this.workspace.options.zoomOptions.scaleSpeed;
    // To compute amount:
    // amount = log(speed, (targetScale / currentScale))
    // Math.log computes natural logarithm (ln), to change the base, use
    // formula: log(base, value) = ln(value) / ln(base)
    const amount = Math.log(targetScale / currentScale) / Math.log(speed);
    this.workspace.beginCanvasTransition();
    this.workspace.zoomCenter(amount);
    this.workspace.scrollCenter();

    setTimeout(this.workspace.endCanvasTransition.bind(this.workspace), 500);
    this.fireZoomEvent();
    Blockly.Touch.clearTouchIdentifier(); // Don't block future drags.
    e.stopPropagation(); // Don't start a workspace scroll.
    e.preventDefault(); // Stop double-clicking from selecting text.
  }

  /** Fires a zoom control UI event. */
  private fireZoomEvent() {
    const uiEvent = new (Blockly.Events.get(Blockly.Events.CLICK))(
      null,
      this.workspace.id,
      'zoom_controls'
    );
    Blockly.Events.fire(uiEvent);
  }
}
