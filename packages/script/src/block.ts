import Script from "./script";
import { loadArray } from "./util";

class BlockShadow {
    public type: string = '';
    public id: string = '';
    public value: any = null;
    public fieldName: string = '';
}

class BlockInput {
    // public name: string = '';
    public shadow: BlockShadow | null = null;
    public block: Block | null = null;
}

class BlockField {
    // public name: string = '';
    public id: string = '';
    public value: any = null;
}

class BlockStatement {
    // public name: string ='';
    public blocks: Block[] = [];
}

class Block {
    public opcode: string = '';
    public id: string = '';
    public x: number = 0;
    public y: number = 0;
    public fields = new Map<string, BlockField>();
    public inputs = new Map<string, BlockInput>();
    public statements = new Map<string, BlockStatement>();
    public isTop: boolean = false;
    public next: Block = null;

    public loadFromXML(xml: any) {
        this.opcode = xml['@_type'];
        this.id = xml['@_id'];
        this.x = xml['@_x'] || 0;
        this.y = xml['@_y'] || 0;

        // parse fields
        const fields = loadArray(xml.field);
        for (const fieldXML of fields) {
            const field = new BlockField();
            field.id = fieldXML['@_id'];
            field.value = fieldXML['#text'];
            this.fields.set(fieldXML['@_name'], field);
        }

        // parse inputs
        const inputs = loadArray(xml.value);
        for (const inputXML of inputs) {
            const input = new BlockInput();

            if (inputXML.shadow) {
                input.shadow = new BlockShadow();
                input.shadow.id = inputXML.shadow['@_id'];
                input.shadow.type = inputXML.shadow['@_type'];
                input.shadow.value = inputXML.shadow.field['#text'];
                input.shadow.fieldName = inputXML.shadow.field['@_name'];
            }

            if (inputXML.block) {
                input.block = new Block();
                input.block.loadFromXML(inputXML.block);
            }

            this.inputs.set(inputXML['@_name'], input);
        }

        // parse statements
        const statements = loadArray(xml.statement);
        for (const statementXML of statements) {
            const statement = new BlockStatement();

            let blockXML = statementXML;
            if (blockXML) {
                do {
                    const block = new Block();
                    block.loadFromXML(blockXML.block);
                    statement.blocks.push(block);
                    blockXML = blockXML.block.next;
                } while(blockXML);
            }

            this.statements.set(statementXML['@_name'], statement);
        }
    }

    public exportXML(): any {
        const xml: any = {
            '@_type': this.opcode,
            '@_id': this.id,
            field: [],
            value: [],
            statement: []
        };

        if (this.isTop) {
            xml['@_x'] = this.x;
            xml['@_y'] = this.y;
        }

        for (const [name, field] of this.fields) {
            // BROADCAST_OPTION have variable_type property
            if (name === 'BROADCAST_OPTION') {
                xml.field.push({
                    '@_name': name,
                    '@_id': field.id,
                    '@_variabletype': 'broadcast_msg',
                    '#text': field.value
                });
            }
            else {
                xml.field.push({
                    '@_name': name,
                    '@_id': field.id,
                    '#text': field.value
                });
            }
        }

        for (const [name, input] of this.inputs) {
            const temp: any = {
                '@_name': name
            };

            if (input.shadow) {
                temp.shadow = {
                    '@_type': input.shadow.type,
                    '@_id': input.shadow.id,
                    field: {
                        '@_name': input.shadow.fieldName,
                        '#text': input.shadow.value
                    }
                };
            }

            if (input.block) {
                temp.block = input.block.exportXML();
            }
            
            xml.value.push(temp);
        }
        
        for (const [name, statement] of this.statements) {
            const temp: any = {
                '@_name': name
            }
            if (statement.blocks.length) {
                temp.block = statement.blocks[0].exportXML();
            }
            xml.statement.push(temp);
        }

        if (this.next) {
            xml.next = {
                block: this.next.exportXML()
            };
        }

        return xml;
    }

    public generateCode(script: Script, needSemicolon: boolean = false) {
        if (script.definition.getBlock(this.opcode) && script.definition.getBlock(this.opcode).toCode) {
            const params = new Map<string, string>();

            for (const [name, field] of this.fields) {
                params.set(name, String(field.value));
            }

            for (const [name, input] of this.inputs) {
                if (input.block) params.set(name, input.block.generateCode(script, false));
                else if (input.shadow) params.set(name, String(input.shadow.value));
                else params.set(name, 'null');
            }

            for (const [name, statement] of this.statements) {
                params.set(name, statement.blocks.map(block => block.generateCode(script, true)).join('\n'));
            }

            return script.definition.getBlock(this.opcode).toCode(params, script);
        }
        else {
            const params: string[] = [];

            for (const [name, field] of this.fields) {
                params.push(String(field.value));
            }

            for (const [name, input] of this.inputs) {
                if (input.block) params.push(input.block.generateCode(script, false));
                else if (input.shadow) params.push(String(input.shadow.value));
                else params.push('null');
            }

            for (const [name, statement] of this.statements) {
                const body = statement.blocks.map(block => block.generateCode(script, true)).join('\n');
                params.push(`() => {\n${body}\n}`);
            }

            return `${this.opcode}(${[...params.values()].join(', ')})${needSemicolon ? ';' : ''}`;
        }
    }
}

export default Block;
export {
    BlockShadow,
    BlockInput,
    BlockField,
    BlockStatement
};
