/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2018 Massachusetts Institute of Technology
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
 * @fileoverview Note input field, for selecting a musical note on a piano.
 * @author ericr@media.mit.edu (Eric Rosenbaum)
 */

import * as Blockly from 'blockly/core';
import styles from '../styles/note.css';

/**
 * Class for a note input field, for selecting a musical note on a piano.
 */
export class FieldNote extends Blockly.FieldTextInput {
  /**
   * Inset in pixels of content displayed in the field, caused by parent properties.
   * The inset is actually determined by the CSS property blocklyDropDownDiv- it is
   * the sum of the padding and border thickness.
   */
  static readonly INSET = 5;

  /**
   * Height of the top area of the field, in px.
   */
  static readonly TOP_MENU_HEIGHT = 32 - FieldNote.INSET;

  /**
   * Padding on the top and sides of the field, in px.
   */
  static readonly EDGE_PADDING = 1;

  /**
   * Height of the drop shadow on the piano, in px.
   */
  static readonly SHADOW_HEIGHT = 4;

  /**
   * Color for the shadow on the piano.
   */
  static readonly SHADOW_COLOR = '#000';

  /**
   * Opacity for the shadow on the piano.
   */
  static readonly SHADOW_OPACITY = 0.2;

  /**
   * A color for the white piano keys.
   */
  static readonly WHITE_KEY_COLOR = '#FFFFFF';

  /**
   * A color for the black piano keys.
   */
  static readonly BLACK_KEY_COLOR = '#323133';

  /**
   * A color for stroke around black piano keys.
   */
  static readonly BLACK_KEY_STROKE = '#555555';

  /**
   * A color for the selected state of a piano key.
   */
  static readonly KEY_SELECTED_COLOR = '#b0d6ff';

  /**
   * The number of white keys in one octave on the piano.
   */
  static readonly NUM_WHITE_KEYS = 8;

  /**
   * Height of a white piano key, in px.
   */
  static readonly WHITE_KEY_HEIGHT = 72;

  /**
   * Width of a white piano key, in px.
   */
  static readonly WHITE_KEY_WIDTH = 40;

  /**
   * Height of a black piano key, in px.
   */
  static readonly BLACK_KEY_HEIGHT = 40;

  /**
   * Width of a black piano key, in px.
   */
  static readonly BLACK_KEY_WIDTH = 32;

  /**
   * Radius of the curved bottom corner of a piano key, in px.
   */
  static readonly KEY_RADIUS = 6;

  /**
   * Bottom padding for the labels on C keys.
   */
  static readonly KEY_LABEL_PADDING = 8;

  /**
   * An array of objects with data describing the keys on the piano.
   */
  static readonly KEY_INFO = [
    {name: 'C', pitch: 0},
    {name: 'C♯', pitch: 1, isBlack: true},
    {name: 'D', pitch: 2},
    {name: 'E♭', pitch: 3, isBlack: true},
    {name: 'E', pitch: 4},
    {name: 'F', pitch: 5},
    {name: 'F♯', pitch: 6, isBlack: true},
    {name: 'G', pitch: 7},
    {name: 'G♯', pitch: 8, isBlack: true},
    {name: 'A', pitch: 9},
    {name: 'B♭', pitch: 10, isBlack: true},
    {name: 'B', pitch: 11},
    {name: 'C', pitch: 12}
  ];

  /**
   * The MIDI note number of the highest note selectable on the piano.
   */
  static readonly MAX_NOTE = 130;

  /**
   * The fraction of the distance to the target location to move the piano at each
   * step of the animation.
   */
  static readonly ANIMATION_FRACTION = 0.2;

  /**
   * Path to the arrow svg icon, used on the octave buttons.
   */
  static readonly ARROW_SVG_PATH = 'icons/arrow_button.svg';

  /**
   * The size of the square octave buttons.
   */
  static readonly OCTAVE_BUTTON_SIZE = 32;

  /**
   * Width of the field. Computed when drawing it, and used for animation.
   */
  private fieldEditorWidth: number = 0;

  /**
   * Height of the field. Computed when drawing it.
   */
  private fieldEditorHeight: number = 0;

  /**
   * The piano SVG.
   */
  private pianoSVG: SVGElement | null = null;

  /**
   * Array of SVG elements representing the clickable piano keys.
   */
  private keySVGs: SVGElement[] = [];

  /**
   * Note name indicator at the top of the field.
   */
  private noteNameText: SVGElement | null = null;

  /**
   * Note name indicator on the low C key.
   */
  private lowCText: SVGElement | null = null;

  /**
   * Note name indicator on the low C key.
   */
  private highCText: SVGElement | null = null;

  /**
   * Octave number of the currently displayed range of keys.
   */
  private displayedOctave: number = 0;

  /**
   * Current animation position of the piano SVG, as it shifts left or right to
   * change octaves.
   */
  private animationPos: number = 0;

  /**
   * Target position for the animation as the piano SVG shifts left or right.
   */
  private animationTarget: number = 0;

  /**
   * A flag indicating that the mouse is currently down. Used in combination with
   * mouse enter events to update the key selection while dragging.
   */
  private mouseIsDown: boolean = false;

  /**
   * An array of wrappers for mouse down events on piano keys.
   */
  private mouseDownWrappers: Blockly.browserEvents.Data[] = [];

  /**
   * A wrapper for the mouse up event.
   */
  private mouseUpWrapper: Blockly.browserEvents.Data | null = null;

  /**
   * An array of wrappers for mouse enter events on piano keys.
   */
  private mouseEnterWrappers: Blockly.browserEvents.Data[] = [];

  /**
   * A wrapper for the mouse down event on the octave down button.
   */
  private octaveDownMouseDownWrapper: Blockly.browserEvents.Data | null = null;

  /**
   * A wrapper for the mouse down event on the octave up button.
   */
  private octaveUpMouseDownWrapper: Blockly.browserEvents.Data | null = null;

  /**
   * @param value The initial content of the field. The
   *     value should cast to a number, and if it does not, '0' will be used.
   * @param validator An optional function that is called
   *     to validate any constraints on what the user entered.  Takes the new
   *     text as an argument and returns the accepted text or null to abort
   *     the change.
   * @param config A map of options used to configure the field.
   */
  constructor(
    value?: string | number,
    validator?: Blockly.FieldTextInputValidator | null,
    config?: Blockly.FieldTextInputConfig
  ) {
    value = (value && !isNaN(value as number)) ? String(value) : '0';
    super(value, validator, config);
  }

  /**
   * Construct a FieldNote from a JSON arg object.
   * @param options A JSON object with options.
   * @returns The new field instance.
   */
  static override fromJson(options: FieldNoteFromJsonConfig): FieldNote {
    return new FieldNote(options.note);
  }

  /**
   * Clean up this FieldNote, as well as the inherited FieldTextInput.
   */
  override dispose(): void {
    super.dispose();
    this.mouseDownWrappers.forEach(function(wrapper) {
      Blockly.browserEvents.unbind(wrapper);
    });
    this.mouseEnterWrappers.forEach(function(wrapper) {
      Blockly.browserEvents.unbind(wrapper);
    });
    if (this.mouseUpWrapper) {
      Blockly.browserEvents.unbind(this.mouseUpWrapper);
    }
    if (this.octaveDownMouseDownWrapper) {
      Blockly.browserEvents.unbind(this.octaveDownMouseDownWrapper);
    }
    if (this.octaveUpMouseDownWrapper) {
      Blockly.browserEvents.unbind(this.octaveUpMouseDownWrapper);
    }
    this.pianoSVG = null;
    this.keySVGs.length = 0;
    this.noteNameText = null;
    this.lowCText = null;
    this.highCText = null;
  }

  /**
   * Show a field with piano keys.
   * @param event Optional mouse event that triggered the field to open, or
   *     undefined if triggered programmatically.
   * @param quietInput True if editor should be created without focus.
   *     Defaults to false.
   */
  protected override showEditor_(event?: Event, quietInput?: boolean): void {
    // Mobile browsers have issues with in-line textareas (focus & keyboards).
    super.showEditor_(event, quietInput, false);

    // If there is an existing drop-down someone else owns, hide it immediately and clear it.
    Blockly.DropDownDiv.hideWithoutAnimation();
    Blockly.DropDownDiv.clearContent();

    // Build the SVG DOM.
    const div = Blockly.DropDownDiv.getContentDiv();

    this.fieldEditorWidth = FieldNote.NUM_WHITE_KEYS * FieldNote.WHITE_KEY_WIDTH + FieldNote.EDGE_PADDING;
    this.fieldEditorHeight = FieldNote.TOP_MENU_HEIGHT + FieldNote.WHITE_KEY_HEIGHT + FieldNote.EDGE_PADDING;

    const svg = Blockly.utils.dom.createSvgElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      'xmlns:html': 'http://www.w3.org/1999/xhtml',
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      version: '1.1',
      height: this.fieldEditorHeight + 'px',
      width: this.fieldEditorWidth + 'px'
    }, div);

    // Add the white and black keys
    // Since we are adding the keys from left to right in order, they need
    // to be in two groups in order to layer correctly.
    this.pianoSVG = Blockly.utils.dom.createSvgElement('g', {}, svg);
    const whiteKeyGroup = Blockly.utils.dom.createSvgElement('g', {}, this.pianoSVG);
    const blackKeyGroup = Blockly.utils.dom.createSvgElement('g', {}, this.pianoSVG);

    // Add three piano octaves, so we can animate moving up or down an octave.
    // Only the middle octave gets bound to events.
    this.keySVGs = [];
    this.addPianoOctave(-this.fieldEditorWidth + FieldNote.EDGE_PADDING, whiteKeyGroup, blackKeyGroup, null);
    this.addPianoOctave(0, whiteKeyGroup, blackKeyGroup, this.keySVGs);
    this.addPianoOctave(this.fieldEditorWidth - FieldNote.EDGE_PADDING, whiteKeyGroup, blackKeyGroup, null);

    // Note name indicator at the top of the field
    this.noteNameText = Blockly.utils.dom.createSvgElement('text', {
      x: this.fieldEditorWidth / 2,
      y: FieldNote.TOP_MENU_HEIGHT / 2,
      class: 'blocklyText',
      'text-anchor': 'middle',
      'dominant-baseline': 'middle'
    }, svg);

    // Note names on the low and high C keys
    const lowCX = FieldNote.WHITE_KEY_WIDTH / 2;
    this.lowCText = this.addCKeyLabel(lowCX, svg);
    const highCX = lowCX + (FieldNote.WHITE_KEY_WIDTH * (FieldNote.NUM_WHITE_KEYS - 1));
    this.highCText = this.addCKeyLabel(highCX, svg);

    // Horizontal line at the top of the keys
    Blockly.utils.dom.createSvgElement('line', {
      stroke: (this.getSourceBlock() as Blockly.BlockSvg).getColourTertiary(),
      x1: 0,
      y1: FieldNote.TOP_MENU_HEIGHT,
      x2: this.fieldEditorWidth,
      y2: FieldNote.TOP_MENU_HEIGHT
    }, svg);

    // Drop shadow at the top of the keys
    Blockly.utils.dom.createSvgElement('rect', {
      x: 0,
      y: FieldNote.TOP_MENU_HEIGHT,
      width: this.fieldEditorWidth,
      height: FieldNote.SHADOW_HEIGHT,
      fill: FieldNote.SHADOW_COLOR,
      'fill-opacity': FieldNote.SHADOW_OPACITY
    }, svg);

    // Octave buttons
    const octaveDownButton = this.addOctaveButton(0, true, svg);
    const octaveUpButton = this.addOctaveButton(
      (this.fieldEditorWidth + FieldNote.INSET * 2) -
      FieldNote.OCTAVE_BUTTON_SIZE, false, svg);

    this.octaveDownMouseDownWrapper = Blockly.browserEvents.bind(
      octaveDownButton, 'mousedown', this,
      function(this: FieldNote) {
        this.changeOctaveBy(-1);
      }
    );
    this.octaveUpMouseDownWrapper = Blockly.browserEvents.bind(
      octaveUpButton, 'mousedown', this,
      function(this: FieldNote) {
        this.changeOctaveBy(1);
      }
    );
    const sourceBlock = this.getSourceBlock() as Blockly.BlockSvg;
    Blockly.DropDownDiv.setColour(
      sourceBlock.getParent()!.getColour(),
      sourceBlock.getParent()!.getColourTertiary()
    );
    Blockly.DropDownDiv.showPositionedByBlock(this, sourceBlock);

    this.updateSelection();
  }

  /**
   * Add one octave of piano keys drawn using SVG.
   * @param x The x position of the left edge of this octave of keys.
   * @param whiteKeyGroup The group for all white piano keys.
   * @param blackKeyGroup The group for all black piano keys.
   * @param keySVGarray An array containing all the key SVGs.
   */
  private addPianoOctave(
    x: number, whiteKeyGroup: SVGElement, blackKeyGroup: SVGElement, keySVGarray: SVGElement[] | null
  ) {
    // eslint-disable-next-line one-var
    let xIncrement, width, height, fill, stroke, group;
    x += FieldNote.EDGE_PADDING / 2;
    const y = FieldNote.TOP_MENU_HEIGHT;
    for (let i = 0; i < FieldNote.KEY_INFO.length; i++) {
      // Draw a black or white key
      if (FieldNote.KEY_INFO[i].isBlack) {
        // Black keys are shifted back half a key
        x -= FieldNote.BLACK_KEY_WIDTH / 2;
        xIncrement = FieldNote.BLACK_KEY_WIDTH / 2;
        width = FieldNote.BLACK_KEY_WIDTH;
        height = FieldNote.BLACK_KEY_HEIGHT;
        fill = FieldNote.BLACK_KEY_COLOR;
        stroke = FieldNote.BLACK_KEY_STROKE;
        group = blackKeyGroup;
      } else {
        xIncrement = FieldNote.WHITE_KEY_WIDTH;
        width = FieldNote.WHITE_KEY_WIDTH;
        height = FieldNote.WHITE_KEY_HEIGHT;
        fill = FieldNote.WHITE_KEY_COLOR;
        stroke = (this.getSourceBlock() as Blockly.BlockSvg).getColourTertiary();
        group = whiteKeyGroup;
      }
      const attr = {
        d: this.getPianoKeyPath(x, y, width, height),
        fill: fill,
        stroke: stroke
      };
      x += xIncrement;

      const keySVG = Blockly.utils.dom.createSvgElement('path', attr, group);

      if (keySVGarray) {
        keySVGarray[i] = keySVG;
        keySVG.setAttribute('data-pitch', `${FieldNote.KEY_INFO[i].pitch}`);
        keySVG.setAttribute('data-name', `${FieldNote.KEY_INFO[i].name}`);
        keySVG.setAttribute('data-isBlack', `${FieldNote.KEY_INFO[i].isBlack}`);

        this.mouseDownWrappers[i] = Blockly.browserEvents.bind(
          keySVG, 'mousedown', this, this.onMouseDownOnKey
        );
        this.mouseEnterWrappers[i] = Blockly.browserEvents.bind(
          keySVG, 'mouseenter', this, this.onMouseEnter
        );
      }
    }
  }

  /**
   * Construct the SVG path string for a piano key shape: a rectangle with rounded
   * corners at the bottom.
   * @param x the x position for the key.
   * @param y the y position for the key.
   * @param width the width of the key.
   * @param height the height of the key.
   * @returns the SVG path as a string.
   */
  private getPianoKeyPath(x: number, y: number, width: number, height: number): string {
    return 'M' + x + ' ' + y + ' ' +
      'L' + x + ' ' + (y + height - FieldNote.KEY_RADIUS) + ' ' +
      'Q' + x + ' ' + (y + height) + ' ' +
      (x + FieldNote.KEY_RADIUS) + ' ' + (y + height) + ' ' +
      'L' + (x + width - FieldNote.KEY_RADIUS) + ' ' + (y + height) + ' ' +
      'Q' + (x + width) + ' ' + (y + height) + ' ' +
      (x + width) + ' ' + (y + height - FieldNote.KEY_RADIUS) + ' ' +
      'L' + (x + width) + ' ' + y + ' ' +
      'L' + x + ' ' + y;
  }

  /**
   * Add a button for switching the displayed octave of the piano up or down.
   * @param x The x position of the button.
   * @param flipped If true, the icon should be flipped.
   * @param svg The svg element to add the buttons to.
   * @returns A group containing the button SVG elements.
   */
  private addOctaveButton(x: number, flipped: boolean, svg: SVGElement): SVGElement {
    const group = Blockly.utils.dom.createSvgElement('g', {}, svg);
    const imageSize = FieldNote.OCTAVE_BUTTON_SIZE;
    const arrow = Blockly.utils.dom.createSvgElement('image', {
      width: imageSize,
      height: imageSize,
      x: x - FieldNote.INSET,
      y: -1 * FieldNote.INSET
    }, group);
    arrow.setAttributeNS(
      'http://www.w3.org/1999/xlink',
      'xlink:href',
      Blockly.getMainWorkspace().options.pathToMedia + FieldNote.ARROW_SVG_PATH
    );
    Blockly.utils.dom.createSvgElement('line', {
      stroke: (this.getSourceBlock() as Blockly.BlockSvg).getColourTertiary(),
      x1: x - FieldNote.INSET,
      y1: 0,
      x2: x - FieldNote.INSET,
      y2: FieldNote.TOP_MENU_HEIGHT - FieldNote.INSET
    }, group);
    if (flipped) {
      const translateX = -1 * FieldNote.OCTAVE_BUTTON_SIZE + (FieldNote.INSET * 2);
      group.setAttribute('transform', 'scale(-1, 1) ' + 'translate(' + translateX + ', 0)');
    }
    return group;
  }

  /**
   * Add an SVG text label for display on the C keys of the piano.
   * @param x The x position for the label.
   * @param svg The SVG element to add the label to.
   * @returns The SVG element containing the label.
   */
  private addCKeyLabel(x: number, svg: SVGElement): SVGElement {
    return Blockly.utils.dom.createSvgElement('text', {
      x: x,
      y: FieldNote.TOP_MENU_HEIGHT + FieldNote.WHITE_KEY_HEIGHT - FieldNote.KEY_LABEL_PADDING,
      class: 'scratchNotePickerKeyLabel',
      'text-anchor': 'middle'
    }, svg);
  }

  /**
   * Set the visibility of the C key labels.
   * @param visible If true, set labels to be visible.
   */
  private setCKeyLabelsVisible(visible: boolean) {
    if (visible) {
      this.fadeSvgToOpacity(this.lowCText!, 1);
      this.fadeSvgToOpacity(this.highCText!, 1);
    } else {
      this.fadeSvgToOpacity(this.lowCText!, 0);
      this.fadeSvgToOpacity(this.highCText!, 0);
    }
  }

  /**
   * Animate an SVG to fade it in or out to a target opacity.
   * @param svg The SVG element to apply the fade to.
   * @param opacity The target opacity.
   */
  private fadeSvgToOpacity(svg: SVGElement, opacity: number) {
    svg.setAttribute('style', 'opacity: ' + opacity + '; transition: opacity 0.1s;');
  }

  /**
   * Handle the mouse down event on a piano key.
   * @param e Mouse down event.
   */
  private onMouseDownOnKey(e: MouseEvent) {
    this.mouseIsDown = true;
    this.mouseUpWrapper = Blockly.browserEvents.bind(document.body, 'mouseup', this, this.onMouseUp);
    this.selectNoteWithMouseEvent(e);
  }

  /**
   * Handle the mouse up event following a mouse down on a piano key.
   */
  private onMouseUp() {
    this.mouseIsDown = false;
    if (this.mouseUpWrapper) {
      Blockly.browserEvents.unbind(this.mouseUpWrapper);
      this.mouseUpWrapper = null;
    }
  }

  /**
   * Handle the event when the mouse enters a piano key.
   * @param e Mouse enter event.
   */
  private onMouseEnter(e: MouseEvent) {
    if (this.mouseIsDown) {
      this.selectNoteWithMouseEvent(e);
    }
  }

  /**
   * Use the data in a mouse event to select a new note, and play it.
   * @param e Mouse event.
   */
  private selectNoteWithMouseEvent(e: MouseEvent) {
    const newNoteNum = Number((e.target as HTMLElement).getAttribute('data-pitch')) + this.displayedOctave * 12;
    this.setEditorValue_(newNoteNum);
    this.playNoteInternal();
  }

  /**
   * Play a note, by calling the externally overriden play note function.
   */
  private playNoteInternal() {
    if (FieldNote.playNote) {
      FieldNote.playNote(Number(this.getValue()), 'Music');
    }
  }

  /**
   * Function to play a musical note corresponding to the key selected.
   * Overridden externally.
   * @param noteNum the MIDI note number to play.
   * @param id An id to select a scratch extension to play the note.
   */
  static playNote(noteNum: number, id: string) {
    return;
  }

  /**
   * Change the selected note by a number of octaves, and start the animation.
   * @param octaves The number of octaves to change by.
   */
  private changeOctaveBy(octaves: number) {
    this.displayedOctave += octaves;
    if (this.displayedOctave < 0) {
      this.displayedOctave = 0;
      return;
    }
    const maxOctave = Math.floor(FieldNote.MAX_NOTE / 12);
    if (this.displayedOctave > maxOctave) {
      this.displayedOctave = maxOctave;
      return;
    }

    const newNote = Number(this.getText()) + (octaves * 12);
    this.setEditorValue_(newNote);

    this.animationTarget = this.fieldEditorWidth * octaves * -1;
    this.animationPos = 0;
    this.stepOctaveAnimation();
    this.setCKeyLabelsVisible(false);
  }

  /**
   * Animate the piano up or down an octave by sliding it to the left or right.
   */
  private stepOctaveAnimation() {
    const absDiff = Math.abs(this.animationPos - this.animationTarget);
    if (absDiff < 1) {
      this.pianoSVG!.setAttribute('transform', 'translate(0, 0)');
      this.setCKeyLabelsVisible(true);
      this.playNoteInternal();
      return;
    }
    this.animationPos += (this.animationTarget - this.animationPos) *
      FieldNote.ANIMATION_FRACTION;
    this.pianoSVG!.setAttribute('transform', 'translate(' + this.animationPos + ',0)');
    requestAnimationFrame(this.stepOctaveAnimation.bind(this));
  }

  /**
   * Used to update the value of a field.
   * @param newValue The value to be saved.
   */
  protected override doValueUpdate_(newValue: string): void {
    super.doValueUpdate_(newValue);
    if (!this.textElement_) {
      // Not rendered yet.
      return;
    }
    this.updateSelection();
    // Cached width is obsolete.  Clear it.
    this.size_.width = 0;
  }

  /**
   * For a MIDI note number, find the index of the corresponding piano key.
   * @param noteNum The note number.
   * @returns The index of the piano key.
   */
  private noteNumToKeyIndex(noteNum: number): number {
    return Math.floor(noteNum) - (this.displayedOctave * 12);
  }

  /**
   * Update the selected note and labels on the field.
   */
  private updateSelection() {
    const noteNum = Number(this.getText());

    // If the note is outside the currently displayed octave, update it
    if (
      this.displayedOctave == null ||
      noteNum > ((this.displayedOctave * 12) + 12) ||
      noteNum < (this.displayedOctave * 12)
    ) {
      this.displayedOctave = Math.floor(noteNum / 12);
    }

    const index = this.noteNumToKeyIndex(noteNum);

    // Clear the highlight on all keys
    this.keySVGs.forEach(function(svg) {
      const isBlack = svg.getAttribute('data-isBlack');
      if (isBlack === 'true') {
        svg.setAttribute('fill', FieldNote.BLACK_KEY_COLOR);
      } else {
        svg.setAttribute('fill', FieldNote.WHITE_KEY_COLOR);
      }
    });
    // Set the highlight on the selected key
    if (this.keySVGs[index]) {
      this.keySVGs[index].setAttribute('fill', FieldNote.KEY_SELECTED_COLOR);
      // Update the note name text
      const noteName = FieldNote.KEY_INFO[index].name;
      this.noteNameText!.textContent = noteName + ' (' + Math.floor(noteNum) + ')';
      // Update the low and high C note names
      const lowCNum = this.displayedOctave * 12;
      this.lowCText!.textContent = 'C(' + lowCNum + ')';
      this.highCText!.textContent = 'C(' + (lowCNum + 12) + ')';
    }
  }

  /**
   * Ensure that only a valid MIDI note number may be entered.
   * @param newValue The user's text.
   * @returns A string representing a valid note number, or null if invalid.
   */
  protected override doClassValidation_(newValue: string): string | null {
    let n = parseFloat(newValue);
    if (isNaN(n)) {
      return null;
    }
    if (n < 0) {
      n = 0;
    }
    if (n > FieldNote.MAX_NOTE) {
      n = FieldNote.MAX_NOTE;
    }
    return String(n);
  }
}

export interface FieldNoteFromJsonConfig extends Blockly.FieldTextInputFromJsonConfig {
  note?: string
}

/**
 * Register the field and any dependencies.
 */
export function registerFieldNote() {
  Blockly.fieldRegistry.register('field_note', FieldNote);
  Blockly.Css.register(styles);
}
