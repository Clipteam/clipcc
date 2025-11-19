/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Displays visual "previews" of where a block will be connected if it is dropped.
 *
 * Most methods are copied from Blockly.InsertionMarkerPreviewer because they are implement in private but we need
 * to re-implement them.
 */
export class InsertionMarkerPreviewer implements Blockly.IConnectionPreviewer {
  /** The workspace of the block is being dragged. */
  protected readonly workspace: Blockly.WorkspaceSvg;

  /** The faded block for replacement preview. */
  protected fadedBlock: Blockly.BlockSvg | null = null;

  /** The connection not being dragged that we are connecting to. */
  protected staticConn: Blockly.RenderedConnection | null = null;

  /** The connection on the block stack being dragged. */
  protected draggedConn: Blockly.RenderedConnection | null = null;

  /** The connection on the marker block. */
  protected markerConn: Blockly.RenderedConnection | null = null;

  /**
   * @param draggedBlock The block is being dragged.
   */
  constructor(draggedBlock: Blockly.BlockSvg) {
    this.workspace = draggedBlock.workspace;
  }

  /**
   * Display a connection preview where the draggedConn connects to the staticConn, replacing the replacedBlock
   * (currently connected to the staticConn).
   * @param draggedConn The connection on the block stack being dragged.
   * @param staticConn The connection not being dragged that we are connecting to.
   * @param replacedBlock The block currently connected to the staticConn that is being replaced.
   */
  previewReplacement(
    draggedConn: Blockly.RenderedConnection,
    staticConn: Blockly.RenderedConnection,
    replacedBlock: Blockly.BlockSvg
  ): void {
    Blockly.Events.disable();
    try {
      this.hidePreview();
      this.fadedBlock = replacedBlock;
      replacedBlock.fadeForReplacement(true);
      if (this.workspace.getRenderer().shouldHighlightConnection(staticConn)) {
        staticConn.highlight();
        this.staticConn = staticConn;
      }
    } finally {
      Blockly.Events.enable();
    }
  }

  /**
   * Display a connection preview where the draggedConn connects to the staticConn, and no block is being relaced.
   * @param draggedConn The connection on the block stack being dragged.
   * @param staticConn The connection not being dragged that we are connecting to.
   */
  previewConnection(
    draggedConn: Blockly.RenderedConnection,
    staticConn: Blockly.RenderedConnection
  ): void {
    if (draggedConn === this.draggedConn && staticConn === this.staticConn) {
      return;
    }

    Blockly.Events.disable();
    try {
      this.hidePreview();

      // TODO(7898): Instead of special casing, we should change the dragger to
      //   track the change in distance between the dragged connection and the
      //   static connection, so that it doesn't disconnect  unless that
      //   (+ a bit) has been exceeded.
      if (this.shouldUseMarkerPreview(draggedConn, staticConn)) {
        this.markerConn = this.previewMarker(draggedConn, staticConn);
      }

      if (this.workspace.getRenderer().shouldHighlightConnection(staticConn)) {
        staticConn.highlight();
      }

      this.draggedConn = draggedConn;
      this.staticConn = staticConn;
    } finally {
      Blockly.Events.enable();
    }
  }

  /**
   * Check whether we should preview the marker.
   * @param draggedConn The connection on the block stack being dragged.
   * @param staticConn The connection not being dragged that we are connecting to.
   * @returns True if we should preview the marker.
   */
  protected shouldUseMarkerPreview(
    draggedConn: Blockly.RenderedConnection,
    staticConn: Blockly.RenderedConnection
  ): boolean {
    return (
      staticConn.type === Blockly.ConnectionType.PREVIOUS_STATEMENT ||
      staticConn.type === Blockly.ConnectionType.NEXT_STATEMENT
    );
  }

  protected previewMarker(
    draggedConn: Blockly.RenderedConnection,
    staticConn: Blockly.RenderedConnection
  ): Blockly.RenderedConnection | null {
    const dragged = draggedConn.getSourceBlock();
    const marker = this.createInsertionMarker(dragged);
    const markerConn = this.getMatchingConnection(dragged, marker, draggedConn);
    if (!markerConn) return null;

    // Render disconnected from everything else so that we have a valid
    // connection location.
    marker.queueRender();
    Blockly.renderManagement.triggerQueuedRenders();

    // Connect() also renders the insertion marker.
    markerConn.connect(staticConn);

    const originalOffsetToTarget = {
      x: staticConn.x - markerConn.x,
      y: staticConn.y - markerConn.y
    };
    const originalOffsetInBlock = markerConn.getOffsetInBlock().clone();
    Blockly.renderManagement.finishQueuedRenders().then(() => {
      if (marker.isDeadOrDying()) return;
      Blockly.Events.disable();
      try {
        // Hide blocks inside the marker block.
        for (const block of marker.getChildren(false)) {
          if (block.getSurroundParent() === marker) {
            block.getSvgRoot().setAttribute('visibility', 'hidden');
          }
        }

        // Position so that the existing block doesn't move.
        marker.positionNearConnection(
          markerConn,
          originalOffsetToTarget,
          originalOffsetInBlock
        );
        marker.getSvgRoot().setAttribute('visibility', 'visible');
      } finally {
        Blockly.Events.enable();
      }
    });
    return markerConn;
  }

  protected saveConnection(
    connection: Blockly.Connection,
    doFullSerialization: boolean,
    saveIds: boolean
  ): Blockly.serialization.blocks.ConnectionState | null {
    const shadow = connection.getShadowState(true);
    const child = connection.targetBlock();
    if (!shadow && !child) {
      return null;
    }
    const state = Object.create(null);
    if (shadow) {
      state['shadow'] = shadow;
    }
    if (child && !child.isShadow()) {
      state['block'] = Blockly.serialization.blocks.save(child, {doFullSerialization, saveIds});
    }
    return state;
  }

  /**
   * Transforms the given block into a JSON representation used to construct an
   * insertion marker.
   * @param block The block to serialize and use as an insertion marker.
   * @returns A JSON-formatted string corresponding to a serialized
   *     representation of the given block suitable for use as an insertion
   *     marker.
   */
  protected serializeBlockToInsertionMarker(block: Blockly.BlockSvg) {
    const blockJson = Blockly.serialization.blocks.save(block, {
      addCoordinates: false,
      addInputBlocks: false,
      addNextBlocks: false,
      doFullSerialization: false
    });

    if (!blockJson) {
      throw new Error(`Failed to serialize source block. ${block.toDevString()}`);
    }

    // Serialize all inputs except non-shadow statements.
    const inputs = Object.create(null);
    for (const input of block.inputList) {
      if (
        !input.connection ||
        (input.type === Blockly.inputs.inputTypes.STATEMENT && !input.connection.targetBlock()?.isShadow())
      ) {
        continue;
      }
      const connectionState = this.saveConnection(input.connection, false, true);
      if (connectionState) {
        inputs[input.name] = connectionState;
      }
    }
    if (Object.keys(inputs).length) {
      blockJson['inputs'] = inputs;
    }

    return blockJson;
  }

  protected createInsertionMarker(origBlock: Blockly.BlockSvg) {
    const blockJson = this.serializeBlockToInsertionMarker(origBlock);
    const result = Blockly.serialization.blocks.append(blockJson, this.workspace) as Blockly.BlockSvg;

    // Turn shadow blocks that are created programmatically during
    // initalization to insertion markers too.
    for (const block of result.getDescendants(false)) {
      block.setInsertionMarker(true);
    }

    result.initSvg();
    result.getSvgRoot().setAttribute('visibility', 'hidden');
    return result;
  }

  /**
   * Gets the connection on the marker block that matches the original connection on the original block.
   * @param origBlock The original block.
   * @param marker The marker block (where we want to find the matching connection).
   * @param origConn The original connection.
   * @returns The matched connection on the marker block.
   */
  protected getMatchingConnection(
    origBlock: Blockly.BlockSvg,
    marker: Blockly.BlockSvg,
    origConn: Blockly.RenderedConnection
  ): Blockly.RenderedConnection | null {
    const origConns = origBlock.getConnections_(true);
    const markerConns = marker.getConnections_(true);
    if (origConns.length !== markerConns.length) return null;
    for (let i = 0; i < origConns.length; i++) {
      if (origConns[i] === origConn) {
        return markerConns[i];
      }
    }
    return null;
  }

  protected hideInsertionMarker(markerConn: Blockly.RenderedConnection) {
    const marker = markerConn.getSourceBlock();
    const markerPrev = marker.previousConnection;
    const markerOutput = marker.outputConnection;

    if (!markerPrev?.targetConnection && !markerOutput?.targetConnection) {
      // If we are the top block, unplugging doesn't do anything.
      // The marker connection may not have a target block if we are hiding
      // as part of applying connections.
      markerConn.targetBlock()?.unplug(false);
    } else {
      marker.unplug(true);
    }

    marker.dispose();
  }

  /**
   * Hide any previews that are currently displayed.
   */
  hidePreview(): void {
    Blockly.Events.disable();
    try {
      if (this.staticConn) {
        this.staticConn.unhighlight();
        this.staticConn = null;
      }
      if (this.fadedBlock) {
        this.fadedBlock.fadeForReplacement(false);
        this.fadedBlock = null;
      }
      if (this.markerConn) {
        this.hideInsertionMarker(this.markerConn);
        this.markerConn = null;
        this.draggedConn = null;
      }
    } finally {
      Blockly.Events.enable();
    }
  }

  /**
   * Dispose of any references held by this connection previewer.
   */
  dispose(): void {
    this.hidePreview();
  }
}

Blockly.registry.register(
  Blockly.registry.Type.CONNECTION_PREVIEWER,
  Blockly.registry.DEFAULT,
  InsertionMarkerPreviewer,
  true
);
