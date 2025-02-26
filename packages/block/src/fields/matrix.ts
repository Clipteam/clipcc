/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Massachusetts Institute of Technology
 * All rights reserved.
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
 * @fileoverview 5x5 matrix input field.
 * Displays an editable 5x5 matrix for controlling LED arrays.
 * @author khanning@gmail.com (Kreg Hanning)
 */

import * as Blockly from 'blockly/core';
import styles from '../styles/matrix.css'

enum LEDState {
  ON = '1',
  OFF = '0'
}

/**
 * Class for a matrix field.
 * @extends {Blockly.Field<string>}
 */
export class FieldMatrix extends Blockly.Field<string> {
  /**
   * Fixed size of the matrix thumbnail in the input field, in px.
   */
  static readonly THUMBNAIL_SIZE = 26;

  /**
   * Fixed size of each matrix thumbnail node, in px.
   */
  static readonly THUMBNAIL_NODE_SIZE = 4;

  /**
   * Fixed size of each matrix thumbnail node, in px.
   */
  static readonly THUMBNAIL_NODE_PAD = 1;

  /**
   * Fixed size of arrow icon in drop down menu, in px.
   */
  static readonly ARROW_SIZE = 12;

  /**
   * Fixed size of each button inside the 5x5 matrix, in px.
   */
  static readonly MATRIX_NODE_SIZE = 18;

  /**
   * Fixed corner radius for 5x5 matrix buttons, in px.
   */
  static readonly MATRIX_NODE_RADIUS = 4;

  /**
   * Fixed padding for 5x5 matrix buttons, in px.
   */
  static readonly MATRIX_NODE_PAD = 5;

  /**
   * String with 25 '0' chars.
   * Used for clearing a matrix or filling an LED node array.
   */
  static readonly ZEROS = '0000000000000000000000000';

  /**
   * String with 25 '1' chars.
   * Used for filling a matrix.
   */
  static readonly ONES = '1111111111111111111111111';

  /**
   * Serializable fields are saved by the serializer, non-serializable fields
   * are not. Editable fields should also be serializable. This is not the
   * case by default so that SERIALIZABLE is backwards compatible.
   */
  SERIALIZABLE: boolean = true;

  /**
   * Array of SVGElement<rect> for matrix thumbnail image on block field.
   */
  private ledThumbNodes: SVGElement[] = [];

  /**
   * Array of SVGElement<rect> for matrix editor in dropdown menu.
   * @type {!Array<>}
   * @private
   */
  private ledButtons: SVGElement[] = [];

  /**
   * SVGElement for LED matrix in editor.
   */
  private matrixStage: SVGElement | null = null;

  /**
   * SVG image for dropdown arrow.
   */
  private arrow: SVGElement | null = null;

  /**
   * String indicating matrix paint style.
   */
  private paintStyle: null | 'fill' | 'clear' = null;

  /**
   * Touch event wrapper.
   * Runs when the field is selected.
   */
  private mouseDownHandler: Blockly.browserEvents.Data | null = null;

  /**
   * Touch event wrapper.
   * Runs when the clear button editor button is selected.
   */
  private clearButtonWrapper: Blockly.browserEvents.Data | null = null;

  /**
   * Touch event wrapper.
   * Runs when the fill button editor button is selected.
   */
  private fillButtonWrapper: Blockly.browserEvents.Data | null = null;

  /**
   * Touch event wrapper.
   * Runs when the matrix editor is touched.
   */
  private matrixTouchWrapper: Blockly.browserEvents.Data | null = null;
  /**
   * Touch event wrapper.
   * Runs when the matrix editor touch event moves.
   */
  private matrixMoveWrapper: Blockly.browserEvents.Data | null = null;

  /**
   * Touch event wrapper.
   * Runs when the matrix editor is released.
   */
  private matrixReleaseWrapper: Blockly.browserEvents.Data | null = null;

  /**
   * @param value The default matrix value represented by a 25-bit integer.
   * @param validator  A function that is called to validate changes to the
   *     field's value. Takes in a value & returns a validated value, or null to
   *     abort the change.
   * @constructor
   */
  constructor(
    value: string,
    validator?: Blockly.FieldValidator | null
  ) {
    super(value, validator);
  }

  /**
   * Construct a FieldMatrix from a JSON arg object.
   * @param options A JSON object with options (matrix).
   * @returns The new field instance.
   */
  static override fromJson(options: FieldMatrixFromJsonConfig): FieldMatrix {
    return new FieldMatrix(options.matrix);
  }

  /**
   * Called when the field is placed on a block.
   */
  protected override initView(): void {
    // Build the DOM
    this.updateSize_();
    const DROPDOWN_ARROW_PADDING = this.getConstants()!.FIELD_DROPDOWN_SVG_ARROW_PADDING;

    const thumbX = DROPDOWN_ARROW_PADDING / 2;
    const thumbY = (this.size_.height - FieldMatrix.THUMBNAIL_SIZE) / 2;
    const thumbnail = Blockly.utils.dom.createSvgElement('g', {
      'transform': 'translate(' + thumbX + ', ' + thumbY + ')',
      'pointer-events': 'bounding-box', 'cursor': 'pointer'
    }, this.fieldGroup_);
    this.ledThumbNodes = [];
    const nodeSize = FieldMatrix.THUMBNAIL_NODE_SIZE;
    const nodePad = FieldMatrix.THUMBNAIL_NODE_PAD;
    for (let i = 0; i < 5; i++) {
      for (let n = 0; n < 5; n++) {
        const attr = {
          'x': ((nodeSize + nodePad) * n) + nodePad,
          'y': ((nodeSize + nodePad) * i) + nodePad,
          'width': nodeSize, 'height': nodeSize,
          'rx': nodePad, 'ry': nodePad
        };
        this.ledThumbNodes.push(
          Blockly.utils.dom.createSvgElement('rect', attr, thumbnail)
        );
      }
      thumbnail.style.cursor = 'default';
      this.updateMatrix();
    }

    if (!this.arrow) {
      const arrowX = FieldMatrix.THUMBNAIL_SIZE + DROPDOWN_ARROW_PADDING * 1.5;
      const arrowY = (this.size_.height - FieldMatrix.ARROW_SIZE) / 2;
      this.arrow = Blockly.utils.dom.createSvgElement('image', {
        'height': FieldMatrix.ARROW_SIZE + 'px',
        'width': FieldMatrix.ARROW_SIZE + 'px',
        'transform': 'translate(' + arrowX + ', ' + arrowY + ')'
      }, this.fieldGroup_);
      this.arrow.setAttributeNS(
        'http://www.w3.org/1999/xlink', 'xlink:href',
        // Blockly.getMainWorkspace doesn't work when initView is called on toolbox init.
        this.getSourceBlock()!.workspace.options.pathToMedia + 'dropdown-arrow.svg'
      );
      this.arrow.style.cursor = 'default';
    }

    this.mouseDownHandler = Blockly.browserEvents.conditionalBind(
      this.getClickTarget_()!, 'mousedown', this, this.onMouseDown_
    );
  }

  /**
   * Show the drop-down menu for editing this field.
   */
  protected override showEditor_(): void {
    // If there is an existing drop-down someone else owns, hide it immediately and clear it.
    Blockly.DropDownDiv.hideWithoutAnimation();
    Blockly.DropDownDiv.clearContent();
    const div = Blockly.DropDownDiv.getContentDiv();
    // Build the SVG DOM.
    const matrixSize = (FieldMatrix.MATRIX_NODE_SIZE * 5) +
      (FieldMatrix.MATRIX_NODE_PAD * 6);
    this.matrixStage = Blockly.utils.dom.createSvgElement('svg', {
      'xmlns': 'http://www.w3.org/2000/svg',
      'xmlns:html': 'http://www.w3.org/1999/xhtml',
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      'version': '1.1',
      'height': matrixSize + 'px',
      'width': matrixSize + 'px'
    }, div);
    // Create the 5x5 matrix
    this.ledButtons = [];
    for (let i = 0; i < 5; i++) {
      for (let n = 0; n < 5; n++) {
        const x = (FieldMatrix.MATRIX_NODE_SIZE * n) +
          (FieldMatrix.MATRIX_NODE_PAD * (n + 1));
        const y = (FieldMatrix.MATRIX_NODE_SIZE * i) +
          (FieldMatrix.MATRIX_NODE_PAD * (i + 1));
        const attr = {
          'x': x + 'px', 'y': y + 'px',
          'width': FieldMatrix.MATRIX_NODE_SIZE,
          'height': FieldMatrix.MATRIX_NODE_SIZE,
          'rx': FieldMatrix.MATRIX_NODE_RADIUS,
          'ry': FieldMatrix.MATRIX_NODE_RADIUS
        };
        const led = Blockly.utils.dom.createSvgElement('rect', attr, this.matrixStage);
        this.matrixStage.appendChild(led);
        this.ledButtons.push(led);
      }
    }

    const sourceBlock = this.getSourceBlock() as Blockly.BlockSvg;
    const sourceBlockParent = sourceBlock.getParent() as Blockly.BlockSvg;
    // Div for lower button menu
    const buttonDiv = document.createElement('div');
    // Button to clear matrix
    const clearButtonDiv = document.createElement('div');
    clearButtonDiv.className = 'scratchMatrixButtonDiv';
    const clearButton = this.createButton(sourceBlockParent.getColourSecondary());
    clearButtonDiv.appendChild(clearButton);
    // Button to fill matrix
    const fillButtonDiv = document.createElement('div');
    fillButtonDiv.className = 'scratchMatrixButtonDiv';
    const fillButton = this.createButton('#FFFFFF');
    fillButtonDiv.appendChild(fillButton);

    buttonDiv.appendChild(clearButtonDiv);
    buttonDiv.appendChild(fillButtonDiv);
    div.appendChild(buttonDiv);

    Blockly.DropDownDiv.setColour(sourceBlockParent.getColour(), sourceBlockParent.getColourTertiary());
    Blockly.DropDownDiv.showPositionedByBlock<string>(this, sourceBlock);

    this.matrixTouchWrapper = Blockly.browserEvents.bind(this.matrixStage, 'mousedown', this, this.onMouseDown);
    this.clearButtonWrapper = Blockly.browserEvents.bind(clearButton, 'click', this, this.clearMatrix);
    this.fillButtonWrapper = Blockly.browserEvents.bind(fillButton, 'click', this, this.fillMatrix);

    // Update the matrix for the current value
    this.updateMatrix();
  }

  /**
   * Make an svg object that resembles a 3x3 matrix to be used as a button.
   * @param fill The color to fill the matrix nodes.
   */
  private createButton(fill: string): SVGElement {
    const button = Blockly.utils.dom.createSvgElement('svg', {
      'xmlns': 'http://www.w3.org/2000/svg',
      'xmlns:html': 'http://www.w3.org/1999/xhtml',
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      'version': '1.1',
      'height': FieldMatrix.MATRIX_NODE_SIZE + 'px',
      'width': FieldMatrix.MATRIX_NODE_SIZE + 'px'
    });
    const nodeSize = FieldMatrix.MATRIX_NODE_SIZE / 4;
    const nodePad = FieldMatrix.MATRIX_NODE_SIZE / 16;
    for (let i = 0; i < 3; i++) {
      for (let n = 0; n < 3; n++) {
        Blockly.utils.dom.createSvgElement('rect', {
          'x': ((nodeSize + nodePad) * n) + nodePad,
          'y': ((nodeSize + nodePad) * i) + nodePad,
          'width': nodeSize, 'height': nodeSize,
          'rx': nodePad, 'ry': nodePad,
          'fill': fill
        }, button);
      }
    }
    return button;
  }

  /**
   * Redraw the matrix with the current value.
   */
  private updateMatrix() {
    const matrix = this.getValue()!;
    const sourceBlockParent = this.getSourceBlock()?.getParent() as Blockly.BlockSvg;
    for (let i = 0; i < matrix.length; i++) {
      if (matrix[i] === LEDState.OFF) {
        this.fillMatrixNode(this.ledButtons, i, sourceBlockParent.getColourSecondary());
        this.fillMatrixNode(this.ledThumbNodes, i, sourceBlockParent.getColour());
      } else {
        this.fillMatrixNode(this.ledButtons, i, '#FFFFFF');
        this.fillMatrixNode(this.ledThumbNodes, i, '#FFFFFF');
      }
    }
  }

  protected override doClassValidation_(newValue?: string): string | null {
    return newValue
      ? newValue + FieldMatrix.ZEROS.substr(0, 25 - newValue.length)
      : newValue ?? '';
  }

  protected override doValueUpdate_(newValue: string): void {
    super.doValueUpdate_(newValue);
    if (!newValue) {
      this.updateMatrix();
    }
  }

  /**
   * Clear the matrix.
   * @param e Mouse event.
   */
  private clearMatrix(e: MouseEvent) {
    if (e.button != 0) return;
    this.setValue(FieldMatrix.ZEROS);
  }

  /**
   * Fill the matrix.
   * @param e Mouse event.
   */
  private fillMatrix(e: MouseEvent) {
    if (e.button != 0) return;
    this.setValue(FieldMatrix.ONES);
  }

  /**
   * Fill matrix node with specified colour.
   * @param node The array of matrix nodes.
   * @param index The index of the matrix node.
   * @param fill The fill colour in '#rrggbb' format.
   */
  private fillMatrixNode(node: SVGElement[], index: number, fill: string) {
    if (!node || !node[index] || !fill) return;
    node[index].setAttribute('fill', fill);
  }

  setLEDNode(led: number, state: LEDState) {
    if (led < 0 || led > 24) return;
    const oldMatrix = this.getValue()!;
    const newMatrix = oldMatrix.substr(0, led) + state + oldMatrix.substr(led + 1);
    this.setValue(newMatrix);
  }

  private fillLEDNode(led: number) {
    if (led < 0 || led > 24) return;
    this.setLEDNode(led, LEDState.ON);
  }

  private clearLEDNode(led: number) {
    if (led < 0 || led > 24) return;
    this.setLEDNode(led, LEDState.OFF);
  }

  private toggleLEDNode(led: number) {
    if (led < 0 || led > 24) return;
    if (this.getValue()?.charAt(led) === LEDState.OFF) {
      this.setLEDNode(led, LEDState.ON);
    } else {
      this.setLEDNode(led, LEDState.OFF);
    }
  }

  /**
   * Toggle matrix nodes on and off.
   * @param e Mouse event.
   */
  protected onMouseDown(e: MouseEvent) {
    this.matrixMoveWrapper = Blockly.browserEvents.bind(document.body, 'mousemove', this, this.onMouseMove);
    this.matrixReleaseWrapper = Blockly.browserEvents.bind(document.body, 'mouseup', this, this.onMouseUp);
    const ledHit = this.checkForLED(e);
    if (ledHit > -1) {
      if (this.getValue()!.charAt(ledHit) === LEDState.OFF) {
        this.paintStyle = 'fill';
      } else {
        this.paintStyle = 'clear';
      }
      this.toggleLEDNode(ledHit);
      this.updateMatrix();
    } else {
      this.paintStyle = null;
    }
  }

  /**
   * Unbind mouse move event and clear the paint style.
   */
  protected onMouseUp() {
    if (this.matrixMoveWrapper) {
      Blockly.browserEvents.unbind(this.matrixMoveWrapper);
      this.matrixMoveWrapper = null;
    }
    if (this.matrixReleaseWrapper) {
      Blockly.browserEvents.unbind(this.matrixReleaseWrapper);
      this.matrixReleaseWrapper = null;
    }
    this.paintStyle = null;
  }

  /**
   * Toggle matrix nodes on and off by dragging mouse.
   * @param e Mouse move event.
   */
  protected onMouseMove(e: MouseEvent) {
    e.preventDefault();
    if (this.paintStyle) {
      const led = this.checkForLED(e);
      if (led < 0) return;
      if (this.paintStyle === 'clear') {
        this.clearLEDNode(led);
      } else if (this.paintStyle === 'fill') {
        this.fillLEDNode(led);
      }
    }
  }

  /**
   * Check if mouse coordinates collide with a matrix node.
   * @param e Mouse move event.
   * @return The matching matrix node or -1 for none.
   */
  protected checkForLED(e: MouseEvent) {
    const bBox = this.matrixStage!.getBoundingClientRect();
    const nodeSize = FieldMatrix.MATRIX_NODE_SIZE;
    const nodePad = FieldMatrix.MATRIX_NODE_PAD;
    const dx = e.clientX - bBox.left;
    const dy = e.clientY - bBox.top;
    const min = nodePad / 2;
    const max = bBox.width - (nodePad / 2);
    if (dx < min || dx > max || dy < min || dy > max) {
      return -1;
    }
    const xDiv = Math.trunc((dx - nodePad / 2) / (nodeSize + nodePad));
    const yDiv = Math.trunc((dy - nodePad / 2) / (nodeSize + nodePad));
    return xDiv + (yDiv * nodePad);
  }

  /**
   * Clean up this FieldMatrix, as well as the inherited Field.
   */
  override dispose(): void {
    super.dispose();
    this.matrixStage = null;
    if (this.mouseDownHandler) {
      Blockly.browserEvents.unbind(this.mouseDownHandler);
      this.mouseDownHandler = null;
    }
    if (this.matrixTouchWrapper) {
      Blockly.browserEvents.unbind(this.matrixTouchWrapper);
      this.matrixTouchWrapper = null;
    }
    if (this.matrixReleaseWrapper) {
      Blockly.browserEvents.unbind(this.matrixReleaseWrapper);
      this.matrixReleaseWrapper = null;
    }
    if (this.matrixMoveWrapper) {
      Blockly.browserEvents.unbind(this.matrixMoveWrapper);
      this.matrixMoveWrapper = null;
    }
    if (this.clearButtonWrapper) {
      Blockly.browserEvents.unbind(this.clearButtonWrapper);
      this.clearButtonWrapper = null;
    }
    if (this.fillButtonWrapper) {
      Blockly.browserEvents.unbind(this.fillButtonWrapper);
      this.fillButtonWrapper = null;
    }
  }

  /**
   * Updates the size of the field based on the text.
   * @param margin margin to use when positioning the text element.
   */
  protected override updateSize_(margin?: number): void {
    this.size_.height = this.getConstants()!.FIELD_TEXT_HEIGHT;
    this.size_.width = FieldMatrix.THUMBNAIL_SIZE + FieldMatrix.ARROW_SIZE +
      (this.getConstants()!.FIELD_DROPDOWN_SVG_ARROW_PADDING * 1.5);
    this.positionBorderRect_();
  }
}

interface FieldMatrixFromJsonConfig extends Blockly.FieldConfig {
  matrix: string;
}

/**
 * Register the field and any dependencies.
 */
export function registerFieldMatrix() {
  Blockly.fieldRegistry.register('field_matrix', FieldMatrix);
  Blockly.Css.register(styles);
}
