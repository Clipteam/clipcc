import BlockPrototype from "./block_prototype";
import { CodeRule, CodeRuleFunction, CodeRuleType } from "./code_rule";

class Definition {
    public blocks: Map<string, BlockPrototype>;
    public codeRule: CodeRule;

    public addBlock(block: BlockPrototype): void {
        this.blocks.set(block.opcode, block);
    }

    public getBlock(opcode: string): BlockPrototype {
        return this.blocks.get(opcode);
    }

    public getCodeRule<T = any>(type: CodeRuleType, key: string): CodeRuleFunction<T> {
        return this.codeRule.get(type).get(key);
    }

    /*
    public *walkFuzzyCodeRule<T = any>(type: CodeRuleType, key: string): Generator<CodeRuleFunction<T>> {
        for (const rule of this.codeFuzzyRule.get(type)) {
            if (rule[0].test(key)) {
                yield rule[1];
            }
        }
    }
    */
}

export default Definition;
