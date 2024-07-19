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

        this.onMouseDown = this.handleMouseDown;
        this.onMouseUp = this.handleMouseUp;
        this.onKeyUp = nudgeTool.onKeyUp;
        this.onKeyDown = nudgeTool.onKeyDown;

        selectRootItem();
        setSelectedItems();
        this.boundingBoxTool.setSelectionBounds();
    }

    setOperation (operation) {
        this.operation = operation;
    }

    handleMouseDown(event) {
        const hitResult = paper.project.hitTest(event.point, {
            tolerance: 2,
            fill: true,
            stroke: true,
            segments: true
        });

        if (hitResult && hitResult.item) {
            this.selectionBoxMode = true;
            this.selectionBoxTool.onMouseDown(event.modifiers.shift);

            const selectedItem = hitResult.item;
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

            item1.remove();
            item2.remove();

            result.selected = true;
            this.setSelectedItems();

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
