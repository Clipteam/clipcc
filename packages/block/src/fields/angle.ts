/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2013 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Angle input field.
 * @author fraser@google.com (Neil Fraser)
 */

import * as Blockly from 'blockly/core';
import styles from '../styles/angle.css';

/**
 * Class for an editable angle field.
 */
export class FieldAngle extends Blockly.FieldNumber {
  /**
   * Round angles to the nearest 15 degrees when using mouse.
   * Set to 0 to disable rounding.
   */
  static readonly ROUND = 15;

  /**
   * Half the width of protractor image.
   */
  static readonly HALF = 120 / 2;

  /* The following two settings work together to set the behaviour of the angle
   * picker.  While many combinations are possible, two modes are typical:
   * Math mode.
   *   0 deg is right, 90 is up.  This is the style used by protractors.
   *   FieldAngle.CLOCKWISE = false;
   *   FieldAngle.OFFSET = 0;
   * Compass mode.
   *   0 deg is up, 90 is right.  This is the style used by maps.
   *   FieldAngle.CLOCKWISE = true;
   *   FieldAngle.OFFSET = 90;
   */

  /**
   * Angle increases clockwise (true) or counterclockwise (false).
   */
  static readonly CLOCKWISE = true;

  /**
   * Offset the location of 0 degrees (and all angles) by a constant.
   * Usually either 0 (0 = right) or 90 (0 = up).
   */
  static readonly OFFSET = 90;

  /**
   * Maximum allowed angle before wrapping.
   * Usually either 360 (for 0 to 359.9) or 180 (for -179.9 to 180).
   */
  static readonly WRAP = 180;

  /**
   * Radius of drag handle
   */
  static readonly HANDLE_RADIUS = 10;

  /**
   * Width of drag handle arrow
   */
  static readonly ARROW_WIDTH = this.HANDLE_RADIUS;

  /**
   * Half the stroke-width used for the "glow" around the drag handle, rounded up to nearest whole pixel
   */
  static readonly HANDLE_GLOW_WIDTH = 3;

  /**
   * Radius of protractor circle.  Slightly smaller than protractor size since
   * otherwise SVG crops off half the border at the edges.
   */
  static readonly RADIUS = this.HALF - this.HANDLE_RADIUS - this.HANDLE_GLOW_WIDTH;

  /**
   * Radius of central dot circle.
   */
  static readonly CENTER_RADIUS = 2;

  /**
   * Path to the arrow svg icon.
   */
  static readonly ARROW_SVG_PATH = 'icons/arrow.svg';

  /**
   * The highlighted portion of the angle picker circle, between 0º and the
   * selected angle.
   */
  private gauge?: SVGPathElement | null;

  /**
   * The line to the angle picker handle.
   */
  private line?: SVGLineElement;

  /**
   * The grabbable handle used to choose an angle.
   */
  private handle?: SVGGElement;

  /**
   * The arrow graphic shown on the grab handle.
   */
  private arrow?: SVGImageElement;

  /**
   * Opaque identifier used to unbind event listener in dispose().
   */
  private mouseDownHandler?: Blockly.browserEvents.Data | null;

  /**
   * Opaque identifier used to unbind event listener in dispose().
   */
  private mouseMoveHandler?: Blockly.browserEvents.Data | null;

  /**
   * Opaque identifier used to unbind event listener in dispose().
   */
  private mouseUpHandler?: Blockly.browserEvents.Data | null;

  /**
   * @param value The initial content of the field. The
   *     value should cast to a number, and if it does not, '0' will be used.
   * @param validator An optional function that is called
   *     to validate any constraints on what the user entered.  Takes the new
   *     text as an argument and returns the accepted text or null to abort
   *     the change.
   */
  constructor(
    value?: string | number | typeof Blockly.Field.SKIP_SETUP,
    validator?: Blockly.FieldNumberValidator | null
  ) {
    super(value, null, null, null, validator);
  }

  /**
   * Clean up this FieldAngle, as well as the inherited FieldTextInput.
   */
  override dispose(): void {
    super.dispose();
    this.gauge = null;
    if (this.mouseDownHandler) {
      Blockly.browserEvents.unbind(this.mouseDownHandler);
    }
    if (this.mouseUpHandler) {
      Blockly.browserEvents.unbind(this.mouseUpHandler);
    }
    if (this.mouseMoveHandler) {
      Blockly.browserEvents.unbind(this.mouseMoveHandler);
    }
  }

  /**
   * Show the inline free-text editor on top of the text.
   * @param event Optional mouse event that triggered the field to open, or
   *     undefined if triggered programmatically.
   * @param quietInput True if editor should be created without focus.
   *     Defaults to false.
   */
  protected override showEditor_(event?: Event, quietInput?: boolean): void {
    super.showEditor_(event, quietInput, false);
    // If there is an existing drop-down someone else owns, hide it immediately and clear it.
    Blockly.DropDownDiv.hideWithoutAnimation();
    Blockly.DropDownDiv.clearContent();
    const div = Blockly.DropDownDiv.getContentDiv();
    // Build the SVG DOM.
    const svg = Blockly.utils.dom.createSvgElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      'xmlns:html': 'http://www.w3.org/1999/xhtml',
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      version: '1.1',
      height: (FieldAngle.HALF * 2) + 'px',
      width: (FieldAngle.HALF * 2) + 'px'
    }, div);
    const circle = Blockly.utils.dom.createSvgElement('circle', {
      cx: FieldAngle.HALF, cy: FieldAngle.HALF,
      r: FieldAngle.RADIUS,
      class: 'blocklyAngleCircle'
    }, svg);
    this.gauge = Blockly.utils.dom.createSvgElement<SVGPathElement>('path', {
      class: 'blocklyAngleGauge'
    }, svg);
    // The moving line, x2 and y2 are set in updateGraph_
    this.line = Blockly.utils.dom.createSvgElement<SVGLineElement>('line', {
      x1: FieldAngle.HALF,
      y1: FieldAngle.HALF,
      class: 'blocklyAngleLine'
    }, svg);
    // The fixed vertical line at the offset
    const offsetRadians = Math.PI * FieldAngle.OFFSET / 180;
    Blockly.utils.dom.createSvgElement('line', {
      x1: FieldAngle.HALF,
      y1: FieldAngle.HALF,
      x2: FieldAngle.HALF + FieldAngle.RADIUS * Math.cos(offsetRadians),
      y2: FieldAngle.HALF - FieldAngle.RADIUS * Math.sin(offsetRadians),
      class: 'blocklyAngleLine'
    }, svg);
    // Draw markers around the edge.
    for (let angle = 0; angle < 360; angle += 15) {
      Blockly.utils.dom.createSvgElement('line', {
        x1: FieldAngle.HALF + FieldAngle.RADIUS - 13,
        y1: FieldAngle.HALF,
        x2: FieldAngle.HALF + FieldAngle.RADIUS - 7,
        y2: FieldAngle.HALF,
        class: 'blocklyAngleMarks',
        transform: 'rotate(' + angle + ',' +
            FieldAngle.HALF + ',' + FieldAngle.HALF + ')'
      }, svg);
    }
    // Center point
    Blockly.utils.dom.createSvgElement('circle', {
      cx: FieldAngle.HALF, cy: FieldAngle.HALF,
      r: FieldAngle.CENTER_RADIUS,
      class: 'blocklyAngleCenterPoint'
    }, svg);
    // Handle group: a circle and the arrow image
    this.handle = Blockly.utils.dom.createSvgElement('g', {}, svg);
    Blockly.utils.dom.createSvgElement('circle', {
      cx: 0,
      cy: 0,
      r: FieldAngle.HANDLE_RADIUS,
      class: 'blocklyAngleDragHandle'
    }, this.handle);
    this.arrow = Blockly.utils.dom.createSvgElement('image', {
      width: FieldAngle.ARROW_WIDTH,
      height: FieldAngle.ARROW_WIDTH,
      x: -FieldAngle.ARROW_WIDTH / 2,
      y: -FieldAngle.ARROW_WIDTH / 2,
      class: 'blocklyAngleDragArrow'
    }, this.handle);
    this.arrow.setAttributeNS(
      'http://www.w3.org/1999/xlink',
      'xlink:href',
      Blockly.getMainWorkspace().options.pathToMedia + FieldAngle.ARROW_SVG_PATH
    );

    const sourceBlock = this.getSourceBlock();
    const sourceBlockParent = sourceBlock?.getParent();
    if (sourceBlock instanceof Blockly.BlockSvg && sourceBlockParent instanceof Blockly.BlockSvg) {
      circle.style.stroke = sourceBlockParent.getColourTertiary();
      circle.style.fill = sourceBlockParent.getColourSecondary();
      Blockly.DropDownDiv.setColour(sourceBlockParent.getColour(), sourceBlockParent.getColourTertiary());
      Blockly.DropDownDiv.showPositionedByBlock(this, sourceBlock);
    }

    this.mouseDownHandler = Blockly.browserEvents.bind(this.handle, 'mousedown', this, this.onMouseDown);

    this.updateGraph();
  }

  /**
   * Redraw the graph with the current angle.
   */
  private updateGraph() {
    if (!this.gauge || !this.line || !this.handle || !this.arrow) {
      return;
    }
    const angleDegrees = Number(this.getText()) % 360 + FieldAngle.OFFSET;
    let angleRadians = Blockly.utils.math.toRadians(angleDegrees);
    const path = ['M ', FieldAngle.HALF, ',', FieldAngle.HALF];
    let x2 = FieldAngle.HALF;
    let y2 = FieldAngle.HALF;
    if (!isNaN(angleRadians)) {
      const angle1 = Blockly.utils.math.toRadians(FieldAngle.OFFSET);
      const x1 = Math.cos(angle1) * FieldAngle.RADIUS;
      const y1 = Math.sin(angle1) * -FieldAngle.RADIUS;
      if (FieldAngle.CLOCKWISE) {
        angleRadians = 2 * angle1 - angleRadians;
      }
      x2 += Math.cos(angleRadians) * FieldAngle.RADIUS;
      y2 -= Math.sin(angleRadians) * FieldAngle.RADIUS;
      // Use large arc only if input value is greater than wrap
      const largeFlag = Math.abs(angleDegrees - FieldAngle.OFFSET) > 180 ? 1 : 0;
      let sweepFlag = Number(FieldAngle.CLOCKWISE);
      if (angleDegrees < FieldAngle.OFFSET) {
        sweepFlag = 1 - sweepFlag; // Sweep opposite direction if less than the offset
      }
      path.push(' l ', x1, ',', y1,
        ' A ', FieldAngle.RADIUS, ',', FieldAngle.RADIUS,
        ' 0 ', largeFlag, ' ', sweepFlag, ' ', x2, ',', y2, ' z');

      // Image rotation needs to be set in degrees
      const imageRotation = FieldAngle.CLOCKWISE ? angleDegrees + 2 * FieldAngle.OFFSET : -angleDegrees;
      this.arrow.setAttribute('transform', 'rotate(' + (imageRotation) + ')');
    }
    this.gauge.setAttribute('d', path.join(''));
    this.line.setAttribute('x2', `${x2}`);
    this.line.setAttribute('y2', `${y2}`);
    this.handle.setAttribute('transform', 'translate(' + x2 + ',' + y2 + ')');
  }

  /**
   * Set the angle to match the mouse's position.
   */
  protected onMouseDown() {
    this.mouseMoveHandler = Blockly.browserEvents.bind(document.body, 'mousemove', this, this.onMouseMove);
    this.mouseUpHandler = Blockly.browserEvents.bind(document.body, 'mouseup', this, this.onMouseUp);
  }

  /**
   * Set the angle to match the mouse's position.
   */
  protected onMouseUp() {
    if (this.mouseMoveHandler) {
      Blockly.browserEvents.unbind(this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
    if (this.mouseUpHandler) {
      Blockly.browserEvents.unbind(this.mouseUpHandler);
      this.mouseUpHandler = null;
    }
  }

  /**
   * Set the angle to match the mouse's position.
   * @param e Mouse move event.
   */
  protected onMouseMove(e: MouseEvent) {
    e.preventDefault();
    const bBox = this.gauge!.ownerSVGElement!.getBoundingClientRect();
    const dx = e.clientX - bBox.left - FieldAngle.HALF;
    const dy = e.clientY - bBox.top - FieldAngle.HALF;
    let angle = Math.atan(-dy / dx);
    if (isNaN(angle)) {
      // This shouldn't happen, but let's not let this error propagate further.
      return;
    }
    angle = Blockly.utils.math.toDegrees(angle);
    // 0: East, 90: North, 180: West, 270: South.
    if (dx < 0) {
      angle += 180;
    } else if (dy > 0) {
      angle += 360;
    }
    if (FieldAngle.CLOCKWISE) {
      angle = FieldAngle.OFFSET + 360 - angle;
    } else {
      angle -= FieldAngle.OFFSET;
    }
    if (FieldAngle.ROUND) {
      angle = Math.round(angle / FieldAngle.ROUND) * FieldAngle.ROUND;
    }
    this.setValue(angle);
    this.setEditorValue_(this.getValue());
    this.resizeEditor_();
  }

  /**
   * Ensure that only an angle may be entered.
   * @param newValue The user's text.
   * @returns A string representing a valid angle, or null if invalid.
   */
  protected override doClassValidation_(newValue: string): number | null {
    let n = parseFloat(newValue);
    if (isNaN(n) || n === Infinity || n === -Infinity) {
      return null;
    }
    n = n % 360;
    if (n < 0) {
      n += 360;
    }
    if (n > FieldAngle.WRAP) {
      n -= 360;
    }
    return Number(n);
  }

  /**
   * Used to update the value of a field.
   * @param newValue The value to be saved.
   */
  protected override doValueUpdate_(newValue: string | number): void {
    super.doValueUpdate_(newValue);
    this.updateGraph();
  }

  /**
   * Construct a FieldAngle from a JSON arg object.
   * @param options A JSON object with options (angle).
   * @returns The new field instance.
   */
  static override fromJson(options: FieldAngleFromJsonConfig): FieldAngle {
    return new FieldAngle(options.angle);
  }
}

export interface FieldAngleFromJsonConfig extends Blockly.FieldNumberFromJsonConfig {
  angle?: number;
}

/**
 * Register the field and any dependencies.
 */
export function registerFieldAngle() {
  Blockly.fieldRegistry.register('field_angle', FieldAngle);
  Blockly.Css.register(styles);
}
