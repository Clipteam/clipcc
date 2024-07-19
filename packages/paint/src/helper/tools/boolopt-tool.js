import paper from '@scratch/paper';
import BoundingBoxTool from '../selection-tools/bounding-box-tool';

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

        this.selectedItems = [];
        this.operation = operation;

        this.onMouseDown = this.handleMouseDown;
        this.onMouseUp = this.handleMouseUp;
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

        this.boundingBoxTool.onMouseUp(event);
    }

    deactivateTool () {}
}

export default BooleanOperationTool;
