/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Type definition for the private fields in Blockly.ZoomControls.
 */
type ZoomControlsInternals = {
  WIDTH: number;
  HEIGHT: number;
  SMALL_SPACING: number;
  LARGE_SPACING: number;
  MARGIN_VERTICAL: number;
  MARGIN_HORIZONTAL: number;
  svgGroup: SVGElement | null;
  zoomInGroup: SVGGElement | null;
  zoomOutGroup: SVGGElement | null;
  zoomResetGroup: SVGGElement | null;
  boundEvents: Blockly.browserEvents.Data[];
  workspace: Blockly.WorkspaceSvg;
  initialized: boolean;
  left: number;
  top: number;

  zoom(amount: number, e: PointerEvent): void;
  resetZoom(e: PointerEvent): void;
};

// @ts-expect-error dirty hack to override Blockly ZoomControls in minimal changes
export class ZoomControls extends Blockly.ZoomControls {
  static readonly XLINK_NS = 'http://www.w3.org/1999/xlink';

  static readonly ICON_SIZE = 36;
  static readonly ICON_SPACING = 8;
  static readonly ICON_MARGIN = 12;
  static readonly TOTAL_HEIGHT = ZoomControls.ICON_SIZE * 3 + ZoomControls.ICON_SPACING * 2;

  /**
   * Zoom in icon path.
   */
  ZOOM_IN_PATH_ = 'zoom-in.svg';

  /**
   * Zoom out icon path.
   */
  ZOOM_OUT_PATH_ = 'zoom-out.svg';

  /**
   * Zoom reset icon path.
   */
  ZOOM_RESET_PATH_ = 'zoom-reset.svg';

  constructor(workspace: Blockly.WorkspaceSvg) {
    super(workspace);
    const internals = this.getInternals_();

    // Override the default sizes with Scratch Blocks flavor sizes.
    internals.WIDTH = ZoomControls.ICON_SIZE;
    internals.HEIGHT = ZoomControls.ICON_SIZE;
    internals.SMALL_SPACING = ZoomControls.ICON_SPACING;
    internals.LARGE_SPACING = ZoomControls.ICON_SPACING;
    internals.MARGIN_VERTICAL = ZoomControls.ICON_MARGIN;
    internals.MARGIN_HORIZONTAL = ZoomControls.ICON_MARGIN;
  }

  /**
   * Create the zoom out icon and its event handler.
   * The Scratch Blocks implementation of this function is different from the
   * Blockly implementation.
   * @param _rnd The random string to use as a suffix in the clip path's ID.
   *     These IDs must be unique in case there are multiple Blockly instances
   *     on the same page.
   */
  protected override createZoomOutSvg(_rnd: string): void {
    const internals = this.getInternals_();
    if (!internals.svgGroup) return;
    internals.zoomOutGroup = Blockly.utils.dom.createSvgElement(
      'g',
      {class: 'blocklyZoom blocklyZoomOut'},
      internals.svgGroup
    ) as SVGGElement;
    const zoomOutGroup = internals.zoomOutGroup;
    if (!zoomOutGroup) return;
    this.appendIcon_(zoomOutGroup, this.ZOOM_OUT_PATH_);
    internals.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        zoomOutGroup,
        'pointerdown',
        null,
        internals.zoom.bind(this, -1)
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
  protected override createZoomInSvg(_rnd: string): void {
    const internals = this.getInternals_();
    if (!internals.svgGroup) return;
    internals.zoomInGroup = Blockly.utils.dom.createSvgElement(
      'g',
      {class: 'blocklyZoom blocklyZoomIn'},
      internals.svgGroup
    ) as SVGGElement;
    const zoomInGroup = internals.zoomInGroup;
    if (!zoomInGroup) return;
    this.appendIcon_(zoomInGroup, this.ZOOM_IN_PATH_);
    internals.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        zoomInGroup,
        'pointerdown',
        null,
        internals.zoom.bind(this, 1)
      )
    );
  }

  /**
   * Create the zoom reset icon and its event handler.
   * The Scratch Blocks implementation of this function is different from the
   * Blockly implementation.
   * @param _rnd The random string to use as a suffix in the clip path's ID.
   */
  protected override createZoomResetSvg(_rnd: string): void {
    const internals = this.getInternals_();
    if (!internals.svgGroup) return;
    internals.zoomResetGroup = Blockly.utils.dom.createSvgElement(
      'g',
      {class: 'blocklyZoom blocklyZoomReset'},
      internals.svgGroup
    ) as SVGGElement;
    const zoomResetGroup = internals.zoomResetGroup;
    if (!zoomResetGroup) return;
    this.appendIcon_(zoomResetGroup, this.ZOOM_RESET_PATH_);
    internals.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        zoomResetGroup,
        'pointerdown',
        null,
        internals.resetZoom.bind(this)
      )
    );
  }

  /**
   * Positions the zoom controls.
   * Override to use Scratch-style ordering: zoom-in, zoom-out, reset (top to bottom).
   * @param metrics The workspace metrics.
   * @param savedPositions List of rectangles that are already on the workspace.
   */
  override position(
    metrics: Blockly.MetricsManager.UiMetrics,
    savedPositions: Blockly.utils.Rect[]
  ): void {
    const internals = this.getInternals_();
    // Not yet initialized.
    if (!internals.initialized) {
      return;
    }

    const cornerPosition =
      Blockly.uiPosition.getCornerOppositeToolbox(
        internals.workspace,
        metrics
      );

    const startRect = Blockly.uiPosition.getStartPositionRect(
      cornerPosition,
      new Blockly.utils.Size(ZoomControls.ICON_SIZE, ZoomControls.TOTAL_HEIGHT),
      ZoomControls.ICON_MARGIN,
      ZoomControls.ICON_MARGIN,
      metrics,
      internals.workspace
    );

    const verticalPosition = cornerPosition.vertical;
    const bumpDirection =
      verticalPosition === Blockly.uiPosition.verticalPosition.TOP ?
        Blockly.uiPosition.bumpDirection.DOWN :
        Blockly.uiPosition.bumpDirection.UP;
    const positionRect = Blockly.uiPosition.bumpPositionRect(
      startRect,
      ZoomControls.ICON_MARGIN,
      bumpDirection,
      savedPositions
    );

    // Position is always the same regardless of vertical position
    internals.zoomInGroup?.setAttribute('transform', 'translate(0, 0)');
    internals.zoomOutGroup?.setAttribute(
      'transform',
      `translate(0, ${ZoomControls.ICON_SIZE + ZoomControls.ICON_SPACING})`
    );
    internals.zoomResetGroup?.setAttribute(
      'transform',
      `translate(0, ${(ZoomControls.ICON_SIZE + ZoomControls.ICON_SPACING) * 2})`
    );

    internals.top = positionRect.top;
    internals.left = positionRect.left;
    internals.svgGroup?.setAttribute(
      'transform',
      `translate(${internals.left}, ${internals.top})`
    );
  }

  /**
   * Appends an icon image to the parent SVG group.
   * @param parent The parent SVG group element to append the icon to.
   * @param fileName The file name of the icon image.
   */
  private appendIcon_(parent: SVGGElement | null, fileName: string) {
    const internals = this.getInternals_();
    if (!parent) return;
    const image = Blockly.utils.dom.createSvgElement(
      'image',
      {
        width: internals.WIDTH,
        height: internals.HEIGHT
      },
      parent
    );
    image.setAttributeNS(
      ZoomControls.XLINK_NS,
      'xlink:href',
      internals.workspace.options.pathToMedia + fileName
    );
  }

  /**
   * A more elegant way to get the internals with type safety.
   * @returns instanced Blockly.ZoomControls
   */
  private getInternals_(): ZoomControlsInternals {
    return this as unknown as ZoomControlsInternals;
  }
}
