/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

interface QuadTreeRecord<T> {
  item: T;
  rect: Blockly.utils.Rect;
}

export class QuadTree<T> {
  /**
   * Records that belong to this node but don't fit into any single child quadrant.
   * (i.e., they overlap the dividing lines).
   */
  protected records: QuadTreeRecord<T>[] = [];
  protected nodes: QuadTree<T>[] = [];
  protected itemMap?: Map<T, Blockly.utils.Rect>;

  constructor(
    protected bounds: Blockly.utils.Rect,
    protected maxObjects = 10,
    protected maxLevels = 5,
    protected level = 0
  ) {
    if (level === 0) {
      this.itemMap = new Map();
    }
  }

  /**
   * Splits the node into four subnodes.
   */
  split(): void {
    const {top, bottom, left, right} = this.bounds;
    const midX = (left + right) / 2;
    const midY = (top + bottom) / 2;

    this.nodes = [
      // Top-Right
      new QuadTree(
        new Blockly.utils.Rect(top, midY, midX, right),
        this.maxObjects,
        this.maxLevels,
        this.level + 1
      ),
      // Top-Left
      new QuadTree(
        new Blockly.utils.Rect(top, midY, left, midX),
        this.maxObjects,
        this.maxLevels,
        this.level + 1
      ),
      // Bottom-Left
      new QuadTree(
        new Blockly.utils.Rect(midY, bottom, left, midX),
        this.maxObjects,
        this.maxLevels,
        this.level + 1
      ),
      // Bottom-Right
      new QuadTree(
        new Blockly.utils.Rect(midY, bottom, midX, right),
        this.maxObjects,
        this.maxLevels,
        this.level + 1
      )
    ];
  }

  /**
   * Determines which quadrant the object belongs to.
   * @param rect The bounding box of the object.
   * @returns The index of the subnode (0-3), or -1 if it doesn't fit completely.
   */
  getIndex(rect: Blockly.utils.Rect): number {
    const midX = (this.bounds.left + this.bounds.right) / 2;
    const midY = (this.bounds.top + this.bounds.bottom) / 2;

    const topQuadrant = rect.bottom <= midY;
    const bottomQuadrant = rect.top >= midY;

    if (rect.right <= midX) {
      if (topQuadrant) return 1; // Top-Left
      if (bottomQuadrant) return 2; // Bottom-Left
    } else if (rect.left >= midX) {
      if (topQuadrant) return 0; // Top-Right
      if (bottomQuadrant) return 3; // Bottom-Right
    }

    return -1;
  }

  /**
   * Inserts an item into the QuadTree.
   * Automatically expands the tree if the item is outside current bounds.
   * @param item The item to insert.
   * @param rect The bounding box of the item.
   */
  insert(item: T, rect: Blockly.utils.Rect): void {
    if (this.level === 0) {
      if (this.itemMap!.has(item)) {
        this.remove(item);
      }
      this.itemMap!.set(item, rect);

      while (!this.contains(this.bounds, rect)) {
        this.grow(rect);
      }
    }

    this.insertInternal(item, rect);
  }

  /**
   * Checks if the inner rectangle is completely contained within the outer rectangle.
   * @param outer The outer rectangle.
   * @param inner The inner rectangle.
   * @returns True if contained, false otherwise.
   */
  protected contains(outer: Blockly.utils.Rect, inner: Blockly.utils.Rect): boolean {
    return (
      inner.left >= outer.left &&
      inner.right <= outer.right &&
      inner.top >= outer.top &&
      inner.bottom <= outer.bottom
    );
  }

  /**
   * Internal recursive insert method.
   * @param item The item to insert.
   * @param rect The bounding box of the item.
   */
  protected insertInternal(item: T, rect: Blockly.utils.Rect): void {
    if (this.nodes.length) {
      const index = this.getIndex(rect);
      if (index !== -1) {
        this.nodes[index].insertInternal(item, rect);
        return;
      }
    }

    this.records.push({item, rect});

    if (this.records.length > this.maxObjects && this.level < this.maxLevels) {
      if (!this.nodes.length) this.split();

      let i = 0;
      while (i < this.records.length) {
        const {item, rect} = this.records[i];
        const index = this.getIndex(rect);
        if (index !== -1) {
          this.records.splice(i, 1);
          this.nodes[index].insertInternal(item, rect);
        } else {
          i++;
        }
      }
    }
  }

  /**
   * Expands the QuadTree bounds to include the given rectangle.
   * Doubles the size of the tree in the necessary direction.
   * @param rect The rectangle that caused the expansion.
   */
  protected grow(rect: Blockly.utils.Rect): void {
    const {top, bottom, left, right} = this.bounds;
    const width = right - left;
    const height = bottom - top;

    const objMidX = (rect.left + rect.right) / 2;
    const objMidY = (rect.top + rect.bottom) / 2;
    const midX = (left + right) / 2;
    const midY = (top + bottom) / 2;

    let newTop = top;
    let newLeft = left;
    let quadrant = 0;

    if (objMidX < midX) {
      newLeft = left - width;
      if (objMidY < midY) {
        newTop = top - height;
        quadrant = 3; // Old becomes Bottom-Right
      } else {
        quadrant = 0; // Old becomes Top-Right
      }
    } else {
      if (objMidY < midY) {
        newTop = top - height;
        quadrant = 2; // Old becomes Bottom-Left
      } else {
        quadrant = 1; // Old becomes Top-Left
      }
    }

    const newBounds = new Blockly.utils.Rect(
      newTop,
      newTop + height * 2,
      newLeft,
      newLeft + width * 2
    );

    const newChild = new QuadTree<T>(
      this.bounds,
      this.maxObjects,
      this.maxLevels,
      this.level + 1
    );
    newChild.nodes = this.nodes;
    newChild.records = this.records;

    this.bounds = newBounds;
    this.nodes = [];
    this.records = [];
    this.split();
    this.nodes[quadrant] = newChild;
  }

  /**
   * Retrieves all items that intersect with the given range.
   * @param range The search range.
   * @param found Array to store found items (optional).
   * @returns Array of found items.
   */
  query(range: Blockly.utils.Rect, found: T[] = []): T[] {
    if (!this.bounds.intersects(range)) return found;

    for (const obj of this.records) {
      if (obj.rect.intersects(range)) {
        found.push(obj.item);
      }
    }

    for (const node of this.nodes) {
      node.query(range, found);
    }

    return found;
  }

  /**
   * Removes an item from the QuadTree.
   * @param item The item to remove.
   * @returns True if the item was found and removed, false otherwise.
   */
  remove(item: T): boolean {
    if (this.level === 0) {
      const rect = this.itemMap!.get(item);
      if (!rect) return false;
      this.itemMap!.delete(item);
      return this.removeInternal(item, rect);
    }
    return false;
  }

  /**
   * Internal recursive remove method.
   * @param item The item to remove.
   * @param rect The bounding box of the item.
   * @returns True if removed, false otherwise.
   */
  protected removeInternal(item: T, rect: Blockly.utils.Rect): boolean {
    if (this.nodes.length) {
      const index = this.getIndex(rect);
      if (index !== -1) {
        return this.nodes[index].removeInternal(item, rect);
      }
    }

    const idx = this.records.findIndex((obj) => obj.item === item);
    if (idx !== -1) {
      this.records.splice(idx, 1);
      return true;
    }

    return false;
  }

  /**
   * Clears the QuadTree.
   */
  clear(): void {
    this.records = [];
    this.nodes = [];
    if (this.level === 0) {
      this.itemMap!.clear();
    }
  }
}
