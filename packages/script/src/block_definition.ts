import BlockPrototype, { BlockType, ParamType, ValueType } from "./block_prototype";
import Script from "./script";
import { parseStringToLiteral } from "./util";

const blockPrototypes = new Map<string, BlockPrototype>([
    // Event
    // event_whentouchingobject
    ['event_whenflagclicked', {
        opcode: 'event_whenflagclicked',
        type: BlockType.HEAD,
        memberName: 'whenGreenFlag',
        eventName: 'whenGreenFlag'
    }],
    ['event_whenthisspriteclicked', {
        opcode: 'event_whenthisspriteclicked',
        type: BlockType.HEAD,
        memberName: 'whenClicked',
        eventName: 'whenClicked'
    }],
    ['event_whenstageclicked', {
        opcode: 'event_whenstageclicked',
        type: BlockType.HEAD,
        memberName: 'whenStageClicked',
        eventName: 'whenStageClicked'
    }],
    ['event_whenbroadcastreceived', {
        opcode: 'event_whenbroadcastreceived',
        type: BlockType.HEAD,
        memberName: 'whenBroadcast',
        eventName: 'broadcast',
        params: [
            { name: 'BROADCAST_OPTION', type: ParamType.FIELD, valueType: ValueType.FIELD }
        ],
        toCode: (params: Map<string, string>): string => {
            return `@broadcast(${parseStringToLiteral(params.get('BROADCAST_OPTION'))})`;
        }
    }],
    // event_whenbackdropswitchesto
    // event_whengreaterthan
    ['event_broadcast', {
        opcode: 'event_broadcast',
        type: BlockType.BODY,
        params: [
            { name: 'BROADCAST_INPUT', type: ParamType.INPUT, valueType: ValueType.STRING }
        ],
        toCode: (params: Map<string, string>): string => {
            return `this.broadcast(${parseStringToLiteral(params.get('BROADCAST_INPUT'))});`;
        }
    }],
    ['event_broadcastandwait', {
        opcode: 'event_broadcastandwait',
        type: BlockType.BODY,
        params: [
            { name: 'BROADCAST_INPUT', type: ParamType.INPUT, valueType: ValueType.STRING }
        ],
        toCode: (params: Map<string, string>): string => {
            return `await this.broadcast(${parseStringToLiteral(params.get('BROADCAST_INPUT'))});`;
        }
    }],
    // event_whenkeypressed

    // Control
    ['control_forever', {
        opcode: 'control_forever',
        type: BlockType.STATEMENT,
        params: [
            { name: 'SUBSTACK', type: ParamType.STATEMENT, valueType: ValueType.STATEMENT }
        ],
        toCode: (params: Map<string, string>): string => {
            return [
                `while (true) {`,
                params.get('SUBSTACK'),
                '}'
            ].join('\n');
        }
    }],
    ['control_repeat', {
        opcode: 'control_repeat',
        type: BlockType.STATEMENT,
        params: [
            { name: 'TIMES', type: ParamType.STATEMENT, valueType: ValueType.NUMBER },
            { name: 'SUBSTACK', type: ParamType.STATEMENT, valueType: ValueType.STATEMENT }
        ],
        toCode: (params: Map<string, string>): string => {
            return [
                `for (int i = ${params.get('TIMES')}; i; --i) {`,
                params.get('SUBSTACK'),
                '}'
            ].join('\n');
        }
    }],
    ['control_if', {
        opcode: 'control_if',
        type: BlockType.STATEMENT,
        params: [
            { name: 'CONDITION', type: ParamType.INPUT, valueType: ValueType.ANY },
            { name: 'SUBSTACK', type: ParamType.STATEMENT, valueType: ValueType.STATEMENT }
        ],
        toCode: (params: Map<string, string>): string => {
            return [
                `if (${params.get('CONDITION')}) {`,
                params.get('SUBSTACK'),
                '}'
            ].join('\n');
        }
    }],
    ['control_if_else', {
        opcode: 'control_if_else',
        type: BlockType.STATEMENT,
        params: [
            { name: 'CONDITION', type: ParamType.INPUT, valueType: ValueType.ANY },
            { name: 'SUBSTACK', type: ParamType.STATEMENT, valueType: ValueType.STATEMENT },
            { name: 'SUBSTACK2', type: ParamType.STATEMENT, valueType: ValueType.STATEMENT }
        ],
        toCode: (params: Map<string, string>): string => {
            return [
                `if (${params.get('CONDITION')}) {`,
                params.get('SUBSTACK'),
                '}', 'else {',
                params.get('SUBSTACK2'),
                '}'
            ].join('\n');
        }
    }],
    ['control_stop', {
        opcode: 'control_stop',
        type: BlockType.BODY,
        params: [],
        toCode: (params: Map<string, string>): string => {
            return 'return;';
        }
    }],
    ['control_wait', {
        opcode: 'control_wait',
        type: BlockType.BODY,
        params: [
            { name: 'DURATION', type: ParamType.INPUT, valueType: ValueType.NUMBER }
        ],
        toCode: (params: Map<string, string>): string => {
            return `wait(${params.get('DURATION')});`;
        }
    }],
    ['control_wait_until', {
        opcode: 'control_wait_until',
        type: BlockType.STATEMENT,
        params: [
            { name: 'CONDITION', type: ParamType.INPUT, valueType: ValueType.ANY }
        ],
        toCode: (params: Map<string, string>): string => {
            return `while (!${params.get('CONDITION')});`;
        }
    }],
    ['control_repeat_until', {
        opcode: 'control_repeat_until',
        type: BlockType.STATEMENT,
        params: [
            { name: 'CONDITION', type: ParamType.INPUT, valueType: ValueType.ANY },
            { name: 'SUBSTACK', type: ParamType.STATEMENT, valueType: ValueType.STATEMENT }
        ],
        toCode: (params: Map<string, string>): string => {
            const cond = params.get('CONDITION');
            return [
                `while (${cond[0] === '!' ? cond.slice(1) : '!' + cond}) {`,
                params.get('SUBSTACK'),
                '}'
            ].join('\n');
        }
    }],
    /*['control_while', { // deprecate
        opcode: 'control_while',
        type: BlockType.STATEMENT,
        params: [
            { name: 'CONDITION', type: ParamType.INPUT, valueType: ValueType.ANY },
            { name: 'SUBSTACK', type: ParamType.STATEMENT, valueType: ValueType.STATEMENT }
        ],
        toCode: (params: Map<string, string>): string => {
            return [
                `while (${params.get('CONDITION')}) {`,
                params.get('SUBSTACK'),
                '}'
            ].join('\n');
        }
    }],*/
    /*['control_for_each', { // deprecate
        opcode: 'control_for_each',
        type: BlockType.STATEMENT,
        params: [
            { name: 'VARIABLE', type: ParamType.FIELD, valueType: ValueType.FIELD },
            { name: 'VALUE', type: ParamType.INPUT, valueType: ValueType.NUMBER },
            { name: 'SUBSTACK', type: ParamType.STATEMENT, valueType: ValueType.STATEMENT }
        ],
        toCode: (params: Map<string, string>): string => {
            return [
                `for (this.var.${params.get('VARIABLE')} = 0; ${params.get('VARIABLE')} < ${params.get('VALUE')}; ++${params.get('VARIABLE')}) {`,
                params.get('SUBSTACK'),
                '}'
            ].join('\n');
        }
    }],*/
    ['control_start_as_clone', {
        opcode: 'control_start_as_clone',
        type: BlockType.HEAD,
        memberName: 'whenClone',
        eventName: 'whenClone'
    }],
    ['control_create_clone_of', {
        opcode: 'control_create_clone_of',
        type: BlockType.BODY,
        params: [
            { name: 'CLONE_OPTION', type: ParamType.FIELD, valueType: ValueType.FIELD }
        ],
        toCode: (params: Map<string, string>): string => {
            return `this.clone(${params.get('CLONE_OPTION')});`;
        }
    }],
    ['control_delete_this_clone', {
        opcode: 'control_delete_this_clone',
        type: BlockType.END,
        params: [],
        toCode: (params: Map<string, string>): string => {
            return [
                `this.deleteClone(${params.get('CLONE_OPTION')});`,
                'return;'
            ].join('\n');
        }
    }],
    /*['control_get_counter', { // deprecate
        opcode: 'control_get_counter',
        type: BlockType.CALLABLE,
        params: [],
        toCode: (params: Map<string, string>): string => {
            return 'this.counter';
        }
    }],*/
    /*['control_incr_counter', { // deprecate
        opcode: 'control_incr_counter',
        type: BlockType.BODY,
        params: [],
        toCode: (params: Map<string, string>): string => {
            return '++this.counter;';
        }
    }],*/
    /*['control_clear_counter', { // deprecate
        opcode: 'control_clear_counter',
        type: BlockType.BODY,
        params: [],
        toCode: (params: Map<string, string>): string => {
            return 'this.counter = 0;';
        }
    }],*/
    /*['control_all_at_once', { // deprecate
        opcode: 'control_all_at_once',
        type: BlockType.STATEMENT,
        params: [
            { name: 'SUBSTACK', type: ParamType.STATEMENT, valueType: ValueType.STATEMENT }
        ],
        toCode: (params: Map<string, string>): string => {
            return [
                '{', `${params.get('SUBSTACK')}`, '}'
            ].join('\n');
        }
    }],*/

    // Operator
    ['operator_add', {
        opcode: 'operator_add',
        type: BlockType.CALLABLE,
        params: [
            { name: 'NUM1', type: ParamType.INPUT, valueType: ValueType.NUMBER },
            { name: 'NUM2', type: ParamType.INPUT, valueType: ValueType.NUMBER }
        ],
        toCode: (params: Map<string, string>): string => {
            return `${params.get('NUM1')} + ${params.get('NUM2')}`
        }
    }],
    ['operator_not', {
        opcode: 'operator_node',
        type: BlockType.CALLABLE,
        params: [
            { name: 'OPERAND', type: ParamType.INPUT, valueType: ValueType.ANY }
        ],
        toCode: (params: Map<string, string>): string => {
            return `!(${params.get('OPERAND')})`;
        }
    }],

    // Data
    ['data_variable', {
        opcode: 'data_variable',
        type: BlockType.CALLABLE,
        params: [
            { name: 'VARIABLE', type: ParamType.FIELD, valueType: ValueType.FIELD }
        ],
        toCode: (params: Map<string, string>, script: Script): string => {
            const variable = script.findVariableByName(params.get('VARIABLE'));
            return `this.${variable.identifier}`;
        }
    }],
    ['data_setvariableto', {
        opcode: 'data_setvariableto',
        type: BlockType.BODY,
        params: [
            { name: 'VARIABLE', type: ParamType.FIELD, valueType: ValueType.FIELD },
            { name: 'VALUE', type: ParamType.INPUT, valueType: ValueType.ANY }
        ],
        toCode: (params: Map<string, string>, script: Script): string => {
            const variable = script.findVariableByName(params.get('VARIABLE'));
            return `this.${variable.identifier} = ${params.get('VALUE')};`;
        }
    }],
    ['data_changevariableby', {
        opcode: 'data_changevariableby',
        type: BlockType.BODY,
        params: [
            { name: 'VARIABLE', type: ParamType.FIELD, valueType: ValueType.FIELD },
            { name: 'VALUE', type: ParamType.INPUT, valueType: ValueType.ANY }
        ],
        toCode: (params: Map<string, string>, script: Script): string => {
            const variable = script.findVariableByName(params.get('VARIABLE'));
            return `this.${variable.identifier} += ${params.get('VALUE')};`;
        }
    }]
]);

export default blockPrototypes;
