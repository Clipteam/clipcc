import Block from "./block";
import Script from "./script";

enum ParamType { FIELD, INPUT, STATEMENT }
enum BlockType { HEAD, END, BODY, CALLABLE, STATEMENT }
enum ValueType { FIELD, NUMBER, STRING, ANY, STATEMENT }

interface BlockParamPrototype {
    name: string;
    type: ParamType;
    valueType: ValueType;
}

interface BlockPrototype {
    opcode: string;
    type: BlockType;
    toCode?: (params: Map<string, string>, script?: Script) => string;
    params?: BlockParamPrototype[];
    memberName?: string;
    eventName?: string;
}

export default BlockPrototype;
export {
    BlockType,
    ParamType,
    ValueType,
    BlockParamPrototype
};
