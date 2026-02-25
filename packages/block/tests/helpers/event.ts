/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {expect} from '@jest/globals';
import * as Blockly from 'blockly/core';

type EventJsonRecord = Record<keyof Blockly.Events.AbstractEventJson, unknown>;

export const BLOCK_EVENTS = [
  Blockly.Events.BLOCK_CREATE,
  Blockly.Events.BLOCK_DELETE,
  Blockly.Events.BLOCK_CHANGE,
  Blockly.Events.BLOCK_MOVE,
  Blockly.Events.BLOCK_DRAG,
  Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE
];

export class EventHelper {
  /** Whether we should record events. */
  private record: boolean = false;

  /** A list of event names to record, empty to record all events. */
  private filter: string[] = [];

  /** The recorded events. */
  private events: Blockly.Events.Abstract[] = [];

  constructor(
    workspace: Blockly.Workspace
  ) {
    workspace.addChangeListener(this.eventHandler.bind(this));
  }

  /**
   * Start recording workspace events.
   * @param filter Names of event to be recorded, leave empty to record all events.
   */
  startRecord(filter: string[] = []): void {
    this.filter = filter;
    this.events.length = 0;
    this.record = true;
  }

  /**
   * Stop recording workspace events.
   */
  stopRecord(): void {
    this.record = false;
  }

  private eventHandler(event: Blockly.Events.Abstract): void {
    if (!this.record) return;
    if (
      this.filter.length === 0 ||
      this.filter.includes(event.type)
    ) {
      this.events.push(event);
    }
  }

  /**
   * Check whether recorded events are the same as given.
   * @param expectList List of expected events to check.
   */
  toEqual(expectList: Array<string | Partial<Blockly.Events.AbstractEventJson>>): void {
    expect(this.events.length).toEqual(expectList.length);

    const length = Math.min(expectList.length, this.events.length);
    for (let i = 0; i < length; ++i) {
      const expectItem = expectList[i];
      const event = this.events[i];
      if (typeof expectItem === 'string') {
        expect(event.type).toStrictEqual(expectItem);
      } else {
        expect(expectItem).toMatchObject(event.toJson() as EventJsonRecord);
      }
    }
  }

  /**
   * Check whether the specific event is raised.
   * @param expectItem Expected event to check.
   */
  toContain(expectItem: string | Partial<Blockly.Events.Abstract>): void {
    for (const event of this.events) {
      if (typeof expectItem === 'string') {
        expect(event.type).toStrictEqual(expectItem);
      } else {
        expect(expectItem).toMatchObject(event.toJson() as EventJsonRecord);
      }
    }
  }

  /**
   * Check whether the specific event is not raised.
   * @param expectItem Expected event to check.
   */
  toNotContain(expectItem: string | Partial<Blockly.Events.Abstract>): void {
    for (const event of this.events) {
      if (typeof expectItem === 'string') {
        expect(event.type).not.toStrictEqual(expectItem);
      } else {
        expect(expectItem).not.toMatchObject(event.toJson() as EventJsonRecord);
      }
    }
  }
}
