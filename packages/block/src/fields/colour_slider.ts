/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
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
 * @fileoverview Colour input field.
 * @author fraser@google.com (Neil Fraser)
 */

import * as Blockly from 'blockly/core';
import styles from '../styles/colour_slider.css';

type ColourChannel = 'hue' | 'saturation' | 'brightness';

/**
 * Class for a slider-based colour input field.
 */
export class FieldColourSlider extends Blockly.Field<string> {
  /**
   * Path to the eyedropper svg icon.
   */
  static readonly EYEDROPPER_PATH = 'eyedropper.svg';

  /**
   * Serializable fields are saved by the serializer, non-serializable fields
   * are not. Editable fields should also be serializable. This is not the
   * case by default so that SERIALIZABLE is backwards compatible.
   */
  override SERIALIZABLE: boolean = true;

  /**
   * Editable fields usually show some sort of UI indicating they are
   * editable. They will also be saved by the serializer.
   */
  override EDITABLE: boolean = false;

  /**
   * Function to be called if eyedropper can be activated.
   * If defined, an eyedropper button will be added to the color picker.
   * The button calls this function with a callback to update the field value.
   * BEWARE: This is not a stable API, so it is being marked as private. It may change.
   */
  static activateEyedropper: ((callback: (colour: string) => void) => void) | null = null;

  private eyedropperEventData?: Blockly.browserEvents.Data;

  /**
   * Flag to track whether or not the slider callbacks should execute.
   */
  private sliderCallbacksEnabled: boolean = false;

  /**
   * Value when editor is opened.
   */
  private valueWhenEditorWasOpened: string | null = null;

  private hue: number = 0;
  private saturation: number = 0;
  private brightness: number = 0;
  private hueSlider?: HTMLInputElement;
  private saturationSlider?: HTMLInputElement;
  private brightnessSlider?: HTMLInputElement;
  private hueReadout?: Element;
  private saturationReadout?: Element;
  private brightnessReadout?: Element;
  private hueChangeEventKey?: Blockly.browserEvents.Data;
  private saturationChangeEventKey?: Blockly.browserEvents.Data;
  private brightnessChangeEventKey?: Blockly.browserEvents.Data;

  /**
   * @param value The initial colour in '#rrggbb' format.
   * @param validator A function that is executed when a new
   *     colour is selected.  Its sole argument is the new colour value.  Its
   *     return value becomes the selected colour, unless it is undefined, in
   *     which case the new colour stands, or it is null, in which case the change
   *     is aborted.
   */
  constructor(
    value: string,
    validator?: Blockly.FieldValidator<string> | null
  ) {
    super(value, validator);
  }

  /**
   * Construct a FieldColourSlider from a JSON arg object.
   * @param options A JSON object with options (colour).
   * @returns The new field instance.
   */
  static override fromJson(options: FieldColourSliderFromJsonConfig): FieldColourSlider {
    return new FieldColourSlider(options.colour);
  }

  /**
   * Called when the field is placed on a block.
   */
  protected override initView(): void {
    this.createTextElement_();
    this.setValue(this.getValue());
  }

  /**
   * Create the hue, saturation or value CSS gradient for the slide backgrounds.
   * @param channel Either "hue", "saturation" or "brightness".
   * @returns Array colour hex colour stops for the given channel.
   */
  private createColourStops(channel: ColourChannel) {
    const stops = [];
    for (let n = 0; n <= 360; n += 20) {
      switch (channel) {
        case 'hue':
          stops.push(Blockly.utils.colour.hsvToHex(n, this.saturation, this.brightness));
          break;
        case 'saturation':
          stops.push(Blockly.utils.colour.hsvToHex(this.hue, n / 360, this.brightness));
          break;
        case 'brightness':
          stops.push(Blockly.utils.colour.hsvToHex(this.hue, this.saturation!, 255 * n / 360));
          break;
        default:
          throw new Error('Unknown channel for colour sliders: ' + channel);
      }
    }
    return stops;
  }

  /**
   * Set the gradient CSS properties for the given node and channel
   * @param node The DOM node the gradient will be set on.
   * @param channel Either "hue", "saturation" or "brightness".
   */
  private setGradient(node: HTMLElement, channel: ColourChannel) {
    const gradient = this.createColourStops(channel).join(',');
    node.style.background = 'linear-gradient(to right, ' + gradient + ')';
  }

  /**
   * Update the readouts and slider backgrounds after value has changed.
   */
  private updateDom() {
    if (this.hueSlider) {
      // Update the slider backgrounds
      this.setGradient(this.hueSlider, 'hue');
      this.setGradient(this.saturationSlider!, 'saturation');
      this.setGradient(this.brightnessSlider!, 'brightness');

      // Update the readouts
      this.hueReadout!.textContent = Math.floor(100 * this.hue / 360).toFixed(0);
      this.saturationReadout!.textContent = Math.floor(100 * this.saturation).toFixed(0);
      this.brightnessReadout!.textContent = Math.floor(100 * this.brightness / 255).toFixed(0);
    }
  }

  /**
   * Update the slider handle positions from the current field value.
   */
  private updateSliderHandles() {
    if (this.hueSlider) {
      // Don't let the following calls to setValue for each of the sliders
      // trigger the slider callbacks (which then call setValue on this field again
      // unnecessarily)
      this.sliderCallbacksEnabled = false;
      this.hueSlider.value = `${this.hue}`;
      this.saturationSlider!.value = `${this.saturation}`;
      this.brightnessSlider!.value = `${this.brightness}`;
      this.sliderCallbacksEnabled = true;
    }
  }

  /**
   * Create label and readout DOM elements, returning the readout.
   * @param labelText Text for the label
   * @returns The container node and the readout node.
   */
  private createLabelDom(labelText: string) {
    const labelContainer = document.createElement('div');
    labelContainer.setAttribute('class', 'scratchColourPickerLabel');
    const readout = document.createElement('span');
    readout.setAttribute('class', 'scratchColourPickerReadout');
    const label = document.createElement('span');
    label.setAttribute('class', 'scratchColourPickerLabelText');
    label.textContent = labelText;
    labelContainer.appendChild(label);
    labelContainer.appendChild(readout);
    return [labelContainer, readout];
  }

  /**
   * Factory for creating the different slider callbacks.
   * @param channel One of "hue", "saturation" or "brightness".
   * @returns The callback for slider update.
   */
  private sliderCallbackFactory(channel: ColourChannel) {
    return (event: Event) => {
      if (!this.sliderCallbacksEnabled) return;
      const channelValue = (event.target as HTMLInputElement).value;
      switch (channel) {
        case 'hue':
          this.hue = Number(channelValue);
          break;
        case 'saturation':
          this.saturation = Number(channelValue);
          break;
        case 'brightness':
          this.brightness = Number(channelValue);
          break;
      }
      const colour = Blockly.utils.colour.hsvToHex(this.hue, this.saturation, this.brightness);
      if (colour !== null) {
        this.setIntermediateValue(colour);
      }
    };
  }

  /**
   * Converts from RGB values to an array of HSV values.
   * @param red Red value in [0, 255].
   * @param green Green value in [0, 255].
   * @param blue Blue value in [0, 255].
   * @returns HSV representation of the color.
   * @see https://github.com/google/closure-library/blob/master/closure/goog/color/color.js#L501
   */
  private rgbToHsv(red: number, green: number, blue: number) {
    const max = Math.max(Math.max(red, green), blue);
    const min = Math.min(Math.min(red, green), blue);
    let hue;
    let saturation;
    const value = max;
    if (min == max) {
      hue = 0;
      saturation = 0;
    } else {
      const delta = (max - min);
      saturation = delta / max;

      if (red == max) {
        hue = (green - blue) / delta;
      } else if (green == max) {
        hue = 2 + ((blue - red) / delta);
      } else {
        hue = 4 + ((red - green) / delta);
      }
      hue *= 60;
      if (hue < 0) {
        hue += 360;
      }
      if (hue > 360) {
        hue -= 360;
      }
    }

    return [hue, saturation, value];
  }

  /**
   * Converts from HEX value to an array of HSV values.
   * @param value HEX value.
   * @returns HSV representation of the color.
   */
  private hexToHsv(value: string) {
    const rgb = Blockly.utils.colour.hexToRgb(value);
    return this.rgbToHsv(rgb[0], rgb[1], rgb[2]);
  }

  /**
   * Change the value without firing a BlockChange event.
   * BlockFieldIntermediateChange event is fired.
   * @param value New value.
   */
  protected setIntermediateValue(value: string) {
    const oldValue = this.value_;
    this.setValue(value, false);
    if (
      this.sourceBlock_ &&
      Blockly.Events.isEnabled() &&
      this.value_ !== oldValue
    ) {
      // Fire a special event indicating that the value changed but the change
      // isn't complete yet and normal field change listeners can wait.
      Blockly.Events.fire(
        new (Blockly.Events.get(Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE))(
          this.sourceBlock_,
          this.name || null,
          oldValue,
          this.value_
        )
      );
    }
  }

  /**
   * Activate the eyedropper, passing in a callback for setting the field value.
   */
  private activateEyedropperInternal() {
    if (!FieldColourSlider.activateEyedropper) {
      return;
    }
    FieldColourSlider.activateEyedropper((value: string) => {
      // Update the internal hue/saturation/brightness values so sliders update.
      const hsv = this.hexToHsv(value);
      this.hue = hsv[0];
      this.saturation = hsv[1];
      this.brightness = hsv[2];
      this.setIntermediateValue(value);
    });
  }

  /**
   * Create hue, saturation and brightness sliders under the colour field.
   */
  protected override showEditor_(): void {
    Blockly.DropDownDiv.hideWithoutAnimation();
    Blockly.DropDownDiv.clearContent();
    const div = Blockly.DropDownDiv.getContentDiv();

    // Init color component values that are used while the editor is open
    // in order to keep the slider values stable.
    const hsv = this.hexToHsv(this.getValue()!);
    this.hue = hsv[0];
    this.saturation = hsv[1];
    this.brightness = hsv[2];

    const hueElements = this.createLabelDom(Blockly.Msg.COLOUR_HUE_LABEL);
    div.appendChild(hueElements[0]);
    this.hueReadout = hueElements[1];
    this.hueSlider = document.createElement('input');
    this.hueSlider.type = 'range';
    this.hueSlider.min = '0';
    this.hueSlider.max = '360';
    this.hueSlider.className = 'scratchColourSlider';
    div.appendChild(this.hueSlider);

    const saturationElements = this.createLabelDom(Blockly.Msg.COLOUR_SATURATION_LABEL);
    div.appendChild(saturationElements[0]);
    this.saturationReadout = saturationElements[1];
    this.saturationSlider = document.createElement('input');
    this.saturationSlider.type = 'range';
    this.saturationSlider.step = '0.001';
    this.saturationSlider.min = '0.0';
    this.saturationSlider.max = '1.0';
    this.saturationSlider.className = 'scratchColourSlider';
    div.appendChild(this.saturationSlider);

    const brightnessElements = this.createLabelDom(Blockly.Msg.COLOUR_BRIGHTNESS_LABEL);
    div.appendChild(brightnessElements[0]);
    this.brightnessReadout = brightnessElements[1];
    this.brightnessSlider = document.createElement('input');
    this.brightnessSlider.type = 'range';
    this.brightnessSlider.min = '0';
    this.brightnessSlider.max = '255';
    this.brightnessSlider.className = 'scratchColourSlider';
    div.appendChild(this.brightnessSlider);

    if (FieldColourSlider.activateEyedropper) {
      const button = document.createElement('button');
      button.setAttribute('class', 'scratchEyedropper');
      const image = document.createElement('img');
      image.src = Blockly.getMainWorkspace().options.pathToMedia + FieldColourSlider.EYEDROPPER_PATH;
      button.appendChild(image);
      div.appendChild(button);
      this.eyedropperEventData = Blockly.browserEvents.conditionalBind(
        button, 'click', this, this.activateEyedropperInternal
      );
    }

    Blockly.DropDownDiv.setColour('#ffffff', '#dddddd');
    Blockly.DropDownDiv.showPositionedByBlock(
      this,
      this.getSourceBlock() as Blockly.BlockSvg,
      this.disposeEditor.bind(this)
    );

    // Set value updates the slider positions
    // Do this before attaching callbacks to avoid extra events from initial set
    this.setValue(this.getValue());
    this.valueWhenEditorWasOpened = this.value_;

    // Enable callbacks for the sliders
    this.sliderCallbacksEnabled = true;

    this.hueChangeEventKey = Blockly.browserEvents.bind(
      this.hueSlider, 'input', this, this.sliderCallbackFactory('hue')
    );
    this.saturationChangeEventKey = Blockly.browserEvents.bind(
      this.saturationSlider, 'input', this, this.sliderCallbackFactory('saturation')
    );
    this.brightnessChangeEventKey = Blockly.browserEvents.bind(
      this.brightnessSlider, 'input', this, this.sliderCallbackFactory('brightness')
    );
  }

  /**
   * Used to update the value of a field.
   * @param newValue The value to be saved.
   */
  protected override doValueUpdate_(newValue: string): void {
    super.doValueUpdate_(newValue);
    this.updateSliderHandles();
    this.updateDom();
    this.applyColour();
  }

  /**
   * Updates the field to match the colour of the block.
   */
  override applyColour(): void {
    const sourceBlock = this.getSourceBlock();
    if (sourceBlock instanceof Blockly.BlockSvg) {
      sourceBlock.pathObject.svgPath.setAttribute('fill', this.getValue() ?? '#000');
      sourceBlock.pathObject.svgPath.setAttribute('stroke', '#fff');
    }
  }

  /**
   * The element to bind the click handler to. If not set explicitly, defaults
   * to the SVG root of the field. When this element is
   * clicked on an editable field, the editor will open.
   * @returns Element to bind click handler to.
   */
  protected override getClickTarget_(): Element | null {
    return (this.sourceBlock_ as Blockly.BlockSvg).getSvgRoot();
  }

  /**
   * A developer hook to override the returned text of this field.
   * @returns Current text or null.
   */
  protected override getText_(): string | null {
    return '';
  }

  /**
   * Closes the editor, saves the results, and disposes of any events or
   * DOM-references belonging to the editor.
   */
  protected disposeEditor() {
    if (this.hueChangeEventKey) {
      Blockly.browserEvents.unbind(this.hueChangeEventKey);
    }
    if (this.saturationChangeEventKey) {
      Blockly.browserEvents.unbind(this.saturationChangeEventKey);
    }
    if (this.brightnessChangeEventKey) {
      Blockly.browserEvents.unbind(this.brightnessChangeEventKey);
    }
    if (this.eyedropperEventData) {
      Blockly.browserEvents.unbind(this.eyedropperEventData);
    }

    if (
      this.sourceBlock_ &&
      Blockly.Events.isEnabled() &&
      this.valueWhenEditorWasOpened !== null &&
      this.valueWhenEditorWasOpened !== this.value_
    ) {
      // When closing a field input widget, fire an event indicating that the
      // user has completed a sequence of changes. The value may have changed
      // multiple times while the editor was open, but this will fire an event
      // containing the value when the editor was opened as well as the new one.
      Blockly.Events.fire(
        new (Blockly.Events.get(Blockly.Events.BLOCK_CHANGE))(
          this.sourceBlock_,
          'field',
          this.name || null,
          this.valueWhenEditorWasOpened,
          this.value_
        )
      );
    }
    this.valueWhenEditorWasOpened = null;
  }
}

export interface FieldColourSliderFromJsonConfig extends Blockly.FieldConfig {
  colour: string;
}

/**
 * Register the field and any dependencies.
 */
export function registerFieldColourSlider() {
  Blockly.fieldRegistry.register('field_colour_slider', FieldColourSlider);
  Blockly.Css.register(styles);
}
