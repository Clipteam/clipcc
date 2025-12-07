/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2018 Google Inc.
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

import * as Blockly from 'blockly/core';
import * as Constants from '../constants';
import * as callbackRegistry from '../callback_registry';
import {FlyoutButton} from './flyout_button';

/**
 * Class for a category header in the flyout for Scratch extensions which can
 * display a textual label and a status button.
 */
export class FlyoutStatusIndicatorLabel extends FlyoutButton {
  /** Size of a status indicator label. */
  static readonly BUTTON_SIZE: number = 30;

  /** The horizontal margin around the button. */
  static readonly BUTTON_MARGIN_X: number = 35;

  /** The vertical margin around the button. */
  static readonly BUTTON_MARGIN_Y: number = 5;

  /** Amount of touchable padding around reporter checkboxes. */
  static readonly BUTTON_TOUCH_PADDING: number = 12;

  protected imageElement: SVGImageElement;
  protected imageElementBackground: SVGRectElement;

  private mouseUpWrapper: Blockly.browserEvents.Data;

  /**
   * @param workspace The workspace in which to place this button.
   * @param targetWorkspace The flyout's target workspace.
   * @param json The JSON specifying the label/button.
   */
  constructor(
    workspace: Blockly.WorkspaceSvg,
    targetWorkspace: Blockly.WorkspaceSvg,
    json: Blockly.utils.toolbox.LabelInfo
  ) {
    super(workspace, targetWorkspace, json, true);

    this.imageElement = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.IMAGE,
      {
        class: 'blocklyFlyoutButton',
        height: FlyoutStatusIndicatorLabel.BUTTON_SIZE + 'px',
        width: FlyoutStatusIndicatorLabel.BUTTON_SIZE + 'px',
        // Set x in updatePosition
        y: FlyoutStatusIndicatorLabel.BUTTON_MARGIN_Y + 'px'
      },
      this.getSvgRoot()
    );
    this.imageElementBackground = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        class: 'blocklyTouchTargetBackground',
        height: FlyoutStatusIndicatorLabel.BUTTON_SIZE + 2 * FlyoutStatusIndicatorLabel.BUTTON_TOUCH_PADDING + 'px',
        width: FlyoutStatusIndicatorLabel.BUTTON_SIZE + 2 * FlyoutStatusIndicatorLabel.BUTTON_TOUCH_PADDING + 'px',
        // Set x in updatePosition
        y: (FlyoutStatusIndicatorLabel.BUTTON_MARGIN_Y - FlyoutStatusIndicatorLabel.BUTTON_TOUCH_PADDING) + 'px'
      },
      this.getSvgRoot()
    );

    this.updatePosition(this.getPosition().x);
    this.refreshStatus();

    this.mouseUpWrapper = Blockly.utils.browserEvents.conditionalBind(
      this.imageElementBackground,
      'mouseup',
      this,
      this.onStatusIndicatorMouseUp
    );
  }

  /**
   * Set the image on the status button using a status string.
   */
  refreshStatus() {
    const status = (callbackRegistry.get('getExtensionState'))(this.labelId!);
    const basePath = this.getTargetWorkspace().options.pathToMedia;
    if (status == Constants.StatusButtonState.READY) {
      this.setImageSrc(basePath + 'status-ready.svg');
    }
    if (status == Constants.StatusButtonState.NOT_READY) {
      this.setImageSrc(basePath + 'status-not-ready.svg');
    }
  }

  /**
   * Set the source URL of the image for the button.
   * @param src New source.
   */
  setImageSrc(src: string) {
    if (src === null) {
      // No change if null.
      return;
    }
    if (this.imageElement) {
      this.imageElement.setAttributeNS(
        'http://www.w3.org/1999/xlink',
        'xlink:href',
        src
      );
    }
  }

  /**
   * Event handler when the status indicator is clicked.
   * @param e The pointer event.
   */
  onStatusIndicatorMouseUp(e: PointerEvent) {
    (callbackRegistry.get('statusButtonCallback'))(this.labelId!);
  }

  /**
   * Update the position of button.
   * @param x The x position of label.
   */
  private updatePosition(x: number) {
    const workspace = this.getWorkspace();
    const flyout = this.getTargetWorkspace().getFlyout()!;

    const flyoutWidth = flyout.getWidth() / workspace.scale;
    const statusButtonX = workspace.RTL ?
      (FlyoutStatusIndicatorLabel.BUTTON_MARGIN_X - flyoutWidth + FlyoutStatusIndicatorLabel.BUTTON_SIZE) :
      (flyoutWidth - FlyoutStatusIndicatorLabel.BUTTON_MARGIN_X - x - FlyoutStatusIndicatorLabel.BUTTON_SIZE);

    this.imageElement.setAttribute('x', `${statusButtonX}px`);
    this.imageElementBackground.setAttribute('x',
      `${statusButtonX - FlyoutStatusIndicatorLabel.BUTTON_TOUCH_PADDING}px`);
  }

  /**
   * Move the button to the given x, y coordinates.
   * @param x The new x coordinate.
   * @param y The new y coordinate.
   */
  override moveTo(x: number, y: number): void {
    super.moveTo(x, y);
    this.updatePosition(x);
  }

  /**
   * Dispose the button.
   */
  override dispose(): void {
    Blockly.utils.browserEvents.unbind(this.mouseUpWrapper);
    super.dispose();
  }
}

