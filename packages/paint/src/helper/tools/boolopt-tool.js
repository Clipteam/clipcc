import Modes from '../../lib/modes';

import paper from '@scratch/paper';
import {selectRootItem} from '../selection';
import BoundingBoxTool from '../selection-tools/bounding-box-tool';
import SelectionBoxTool from '../selection-tools/selection-box-tool';
import NudgeTool from '../selection-tools/nudge-tool';

class BooleanOperationTool extends paper.Tool {
    constructor(setSelectedItems, clearSelectedItems, setCursor, onUpdateImage, operation) {
        super();

        this.setSelectedItems = setSelectedItems;
        this.clearSelectedItems = clearSelectedItems;
        this.onUpdateImage = onUpdateImage;

        this.boundingBoxTool = new BoundingBoxTool(
            'select',
            setSelectedItems,
            clearSelectedItems,
            setCursor,
            onUpdateImage
        );

        const nudgeTool = new NudgeTool(Modes.BOOLOPT, this.boundingBoxTool, onUpdateImage);
        this.selectionBoxTool = new SelectionBoxTool(Modes.BOOLOPT, setSelectedItems, clearSelectedItems);
        this.selectionBoxMode = false;

        this.selectedItems = [];
        this.operation = operation;

        this.onSelectionChanged = this.onSelectionChanged.bind(this);
        this.onMouseDown = this.handleMouseDown;
        this.onMouseUp = this.handleMouseUp;
        this.onKeyUp = nudgeTool.onKeyUp;
        this.onKeyDown = nudgeTool.onKeyDown;

        selectRootItem();
        setSelectedItems();
        this.boundingBoxTool.setSelectionBounds();
    }

    /**
     * Should be called if the selection changes to update the bounds of the bounding box.
     * @param {Array<paper.Item>} selectedItems Array of selected items.
     */
    onSelectionChanged(selectedItems) {
        this.boundingBoxTool.onSelectionChanged(selectedItems);
    }

    setOperation (operation) {
        this.operation = operation;
    }

    handleMouseDown(event) {
        this.selectionBoxMode = true;
        this.selectionBoxTool.onMouseDown(event.modifiers.shift);

        const hitResult = paper.project.hitTest(event.point, {
            tolerance: 2,
            fill: true,
            stroke: true,
            segments: true
        });

        if (hitResult && hitResult.item) {
            const selectedItem = hitResult.item;
            // PointText doesn't support boolean operation
            if (selectedItem.fontSize) {
                alert(`Text doesn't support boolean operations.`);
                return;
            }
            if (!this.selectedItems.includes(selectedItem)) {
                this.selectedItems.push(selectedItem);
                selectedItem.selected = true;
            }

            if (this.selectedItems.length === 2) {
                // Both items are selected, wait for mouse up to apply boolean operation
                this.boundingBoxTool.onMouseDown(event);
            }
        }
    }

    handleMouseUp(event) {
        this.boundingBoxTool.onMouseUp(event);
        if (this.selectedItems.length === 2) {
            const [item1, item2] = this.selectedItems;
            let result;
            try {
                switch (this.operation) {
                    case 'unite':
                        result = item1.unite(item2);
                        break;
                    case 'intersect':
                        result = item1.intersect(item2);
                        break;
                    case 'subtract':
                        result = item1.subtract(item2);
                        break;
                    case 'exclude':
                        result = item1.exclude(item2);
                        break;
                    case 'divide':
                        result = item1.divide(item2);
                        break;
                    default:
                        console.warn('Unknown boolean operation');
                        return;
                }
            } catch (e) {
                item1.selected = false;
                item2.selected = false;
                this.setSelectedItems([]);
                this.boundingBoxTool.onSelectionChanged([]);
                console.error(e);
                alert('Failed to apply boolean operation: ' + e.message);
                return;
            }

            item1.remove();
            item2.remove();

            result.selected = true;
            this.setSelectedItems([result]);

            this.selectedItems = [result];
            this.boundingBoxTool.onSelectionChanged([result]);

            this.onUpdateImage();
        }
    }

    deactivateTool () {
        this.boundingBoxTool.deactivateTool();
        this.selectionBoxTool = null;
        this.onMouseDown = null;
        this.onKeyDown = null;
        this.onMouseUp = null;
        this.onKeyUp = null;
    }
}

export default BooleanOperationTool;
