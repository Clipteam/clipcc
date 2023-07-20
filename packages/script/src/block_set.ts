import Block from "./block";
import { BlockType } from "./block_prototype";
import Script from "./script";
import { parseStringToLiteral } from "./util";

class BlockSet {
    public topBlock: Block;
    public bodyBlocks: Block[] = [];

    public push(block: Block): void {
        this.bodyBlocks.push(block);
    }

    public getTopBlock(): Block | null {
        if (this.topBlock) return this.topBlock;
        else if (this.bodyBlocks.length) return this.bodyBlocks[0];
        else return null;
    }

    public generateCode(script: Script): string {
        const code: string[] = [];

        const topBlock = this.getTopBlock();
        if (topBlock) {
            code.push(`@position(${topBlock.x}, ${topBlock.y})`);

            // check if event
            const def = script.definition.getBlock(topBlock.opcode);
            if (def && def.type === BlockType.HEAD) {
                if (def.toCode) {
                    code.push(topBlock.generateCode(script));
                } else {
                    code.push(`@event(${parseStringToLiteral(def.eventName)})`);
                }
            }
        }

        let name = script.generateMemberName(topBlock.opcode);
        code.push(`${name}() {`);

        for (const block of this.bodyBlocks) {
            code.push(block.generateCode(script));
        }

        code.push('}');
        return code.join('\n');
    }

    public exportXML(): any {
        if (this.topBlock.isTop) {
            return this.topBlock.exportXML();
        }
        else {
            return this.bodyBlocks[0].exportXML();
        }
    }
}

export default BlockSet;
