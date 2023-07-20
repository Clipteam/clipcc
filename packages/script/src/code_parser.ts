import babel = require('@babel/parser');
import type = require('@babel/types');
import Script from './script';
import Block, { BlockField, BlockInput, BlockShadow, BlockStatement } from './block';
import { generateBlockID } from './util';
import BlockSet from './block_set';
import { CodeRuleType } from './code_rule';
import Variable from './variable';
import Broadcast from './broadcast';

// @todo: cross-line optimization
enum CodeStatementType {
    AssignmentToMember,
    BinaryOperatorExpression,
    MemberList
}

class CodeStatement {
    public type: CodeStatementType;
    public data: (CodeStatement | string | number | boolean)[];
}

type LiteralType = 'StringLiteral' | 'NumericLiteral';

class CodeParser {
    public option: babel.ParserOptions;
    public script: Script;

    constructor(script: Script) {
        this.option = {
            sourceType: 'module',
            plugins: [
                ['decorators', {
                    decoratorsBeforeExport: false
                }],
                'classProperties'
            ]
        };
        this.script = script;
    }

    public loadFullCode(code: string): void {
        const ast = babel.parse(code, this.option).program;
        this.script.clear();

        const program = ast;
        for (const node of program.body) {
            if (node.type === 'ImportDeclaration') {
                this.parseImportDeclaration(node);
            }
            else if (node.type === 'ClassDeclaration') {
                this.parseClassDeclaration(node);
            }
            else {
                throw 'Unexpected Statement';
            }
        }
    }

    public parseImportDeclaration(node: type.ImportDeclaration): void {
        // @todo
    }

    public parseClassDeclaration(node: type.ClassDeclaration): void {
        // get class name
        const className = node.id.name;

        // check super class name
        // can only be Stage or Sprite
        if (node.superClass.type !== 'Identifier') {
            throw 'Invalid Super Class';
        }
        const superClassName = node.superClass.name;
        if (!(superClassName == 'Stage' || superClassName == 'Sprite')) {
            throw 'Unknown Super Class';
        }

        // parse each method/property
        for (const item of node.body.body) {
            if (item.type === 'ClassMethod') {
                const methodName = (<type.Identifier>item.key).name;
                const blockSet = new BlockSet();

                blockSet.bodyBlocks = this.parseBlockStatement(item.body);
                blockSet.topBlock = new Block();
                let last = blockSet.topBlock;
                for (const block of blockSet.bodyBlocks) {
                    last.next = block;
                    last = block;
                }

                if (item.decorators) {
                    for (const decorator of item.decorators) {
                        this.parseMethodDecorator(blockSet, decorator);
                    }
                }

                if (!blockSet.topBlock.isTop && blockSet.bodyBlocks.length) {
                    blockSet.bodyBlocks[0].isTop = true;
                    blockSet.bodyBlocks[0].x = blockSet.topBlock.x;
                    blockSet.bodyBlocks[0].y = blockSet.topBlock.y;
                }

                this.script.blockSets.push(blockSet);
            }
            else if (item.type === 'ClassProperty') {
                for (const decorator of item.decorators) {
                    if (item.key.type !== 'Identifier') {
                        throw 'Property Syntax Error';
                    }
                    this.parsePropertyDecorator(item.key, decorator);
                }
            }
            else {
                throw 'Syntax Error';
            }
        }
    }

    public parseLiteral(node: type.Literal, type?: LiteralType): any {
        if (type) {
            if (node.type === type) return node.value;
            else throw 'Invalid Literal';
        }
        else {
            if (node.type === 'NullLiteral') return null;
            else if (node.type !== 'RegExpLiteral' && node.type !== 'TemplateLiteral') {
                return node.value;
            }
            else throw 'Invalid Literal';
        }
    }

    public parsePropertyDecorator(property: type.Identifier, node: type.Decorator): void {
        const expression = node.expression;

        if (expression.type === 'CallExpression' && expression.callee.type === 'Identifier') {
            if (expression.callee.name === 'variable') {
                // arg[0]: var name
                const variable = new Variable();
                variable.id = generateBlockID();
                variable.name = this.parseLiteral(<type.Literal>expression.arguments[0], 'StringLiteral');
                variable.identifier = property.name;
                variable.isLocal = true;
                variable.isCloud = false;
                this.script.variables.push(variable);
            }
            else {
                throw 'Unknown Decorator';
            }
        }
        else {
            throw 'Unsupported Decorator Syntax';
        }
    }

    public parseMethodDecorator(blockSet: BlockSet, node: type.Decorator): void {
        const expression = node.expression;
        let topBlock = blockSet.topBlock;

        if (expression.type === 'CallExpression' && expression.callee.type === 'Identifier') {
            if (expression.callee.name === 'position') {
                // arg[0]: x
                topBlock.x = this.parseLiteral(<type.Literal>expression.arguments[0], 'NumericLiteral');
                // arg[1]: y
                topBlock.y = this.parseLiteral(<type.Literal>expression.arguments[1], 'NumericLiteral');
            }
            else if (expression.callee.name === 'event') {
                // arg[0]: event name
                const event = this.parseLiteral(<type.Literal>expression.arguments[0], 'StringLiteral');
                if (event === 'whenGreenFlag') {
                    topBlock.opcode = 'event_whenflagclicked';
                    topBlock.isTop = true;
                }
                else {
                    throw 'Unknown Event';
                }
            }
            else if (expression.callee.name === 'broadcast') {
                // arg[0]: broadcast name
                const name = this.parseLiteral(<type.Literal>expression.arguments[0], 'StringLiteral');
                if (!this.script.broadcastNames.has(name)) {
                    const broadcast = new Broadcast();
                    broadcast.id = generateBlockID();
                    broadcast.name = name;
                    this.script.broadcasts.push(broadcast);
                    this.script.broadcastNames.add(name);
                }
                
                topBlock.opcode = 'event_whenbroadcastreceived';
                topBlock.isTop = true;
                const field = new BlockField();
                field.id = generateBlockID();
                field.value = name;
                topBlock.fields.set('BROADCAST_OPTION', field);
            }
            else {
                throw 'Unknown Decorator';
            }
        }
        else {
            throw 'Unsupported Decorator Syntax';
        }
    }

    public parseBlockStatement(node: type.BlockStatement): Block[] {
        const blocks: Block[] = [];
        for (const statement of node.body) {
            switch (statement.type) {
                case 'ExpressionStatement': {
                    blocks.push(this.parseExpressionStatement(statement));
                    break;
                }
                case 'WhileStatement': {
                    if (statement.test.type === 'BooleanLiteral') {
                        // while (true)
                        if (statement.test.value) {
                            const block = new Block();
                            block.id = generateBlockID();
                            block.opcode = 'control_forever';
                            if (statement.body.type === 'BlockStatement') {
                                const substack = new BlockStatement();
                                substack.blocks = this.parseBlockStatement(statement.body);
                                block.statements.set('SUBSTACK', substack);
                            }
                            else {
                                throw 'Wrong While';
                            }
                            blocks.push(block);
                        }
                        else {
                            throw 'Wrong While';
                        }
                    }
                    else {
                        let input = this.parseExpressionOrLiteralToInput(statement.test, false);
                        if (input.block.opcode === 'operator_not') {
                            input = input.block.inputs.get('OPERAND');
                        }
                        else {
                            const temp = new BlockInput();
                            temp.block = new Block();
                            temp.block.id = generateBlockID();
                            temp.block.opcode = 'operator_not';
                            temp.block.inputs.set('OPERAND', input);
                            input = temp;
                        }

                        const block = new Block();
                        block.id = generateBlockID();
                        block.opcode = 'control_repeat_until';
                        block.inputs.set('CONDITION', input);
                        if (statement.body.type === 'BlockStatement') {
                            const substack = new BlockStatement();
                            substack.blocks = this.parseBlockStatement(statement.body);
                            block.statements.set('SUBSTACK', substack);
                        }
                        else {
                            throw 'Wrong While';
                        }
                        blocks.push(block);
                    }
                    break;
                }
                case 'IfStatement': {
                    console.log(statement);

                    const block = new Block();
                    block.id = generateBlockID();
                    block.opcode = statement.alternate ? 'control_if_else' : 'control_if';
                    block.inputs.set('CONDITION', this.parseExpressionOrLiteralToInput(statement.test, false));
                    
                    if (statement.consequent.type === 'BlockStatement') {
                        const substack = new BlockStatement();
                        substack.blocks = this.parseBlockStatement(statement.consequent);
                        block.statements.set('SUBSTACK', substack);
                    }
                    else {
                        throw 'Wrong If';
                    }

                    if (statement.alternate) {
                        if (statement.alternate.type === 'BlockStatement') {
                            const substack = new BlockStatement();
                            substack.blocks = this.parseBlockStatement(statement.consequent);
                            block.statements.set('SUBSTACK2', substack);
                        }
                        else {
                            throw 'Wrong IfElse';
                        }
                    }

                    blocks.push(block);
                    break;
                }
                default: {
                    console.log(statement);
                    throw 'Unknown Statement Type';
                }
            }
        }
        return blocks;
    }

    public useCodeRule(type: CodeRuleType, key: string, node: type.Expression, isAwait?: boolean): Block {
        const rule = this.script.definition.getCodeRule(type, key);
        return rule ? rule(node, this, isAwait) : null;
    }

    public parseExpressionStatement(node: type.ExpressionStatement): Block {
        let isAwait = false;
        if (node.expression.type === 'AwaitExpression') {
            isAwait = true;
            node.expression = node.expression.argument;
        }
        if (node.expression.type === 'AssignmentExpression') {
            const operator = node.expression.operator;
            if (operator !== '=' && operator !== '+=') {
                throw 'Unsupported Operator';
            }

            const left = node.expression.left;
            const right = node.expression.right;
            if (left.type === 'MemberExpression') {
                if (left.object.type === 'ThisExpression') {
                    // this.xxx = xxx;
                    if (left.property.type === 'Identifier') {
                        const block = this.useCodeRule(
                            CodeRuleType.AssignmentProperty,
                            left.property.name, node.expression, isAwait
                        );
                        if (!block) {
                            // check if this is variable
                            const variable = this.script.findVariableByIdentifier(left.property.name);
                            if (variable) {
                                const block = new Block();
                                block.id = generateBlockID();
                                block.opcode = operator === '=' ? 'data_setvariableto' : 'data_changevariableby';
                                const field = new BlockField();
                                field.id = generateBlockID();
                                field.value = variable.name;
                                block.fields.set('VARIABLE', field);
                                block.inputs.set('VALUE', this.parseExpressionOrLiteralToInput(
                                    right, true, 'text', 'TEXT'
                                ));
                                return block;
                            }
                            else {
                                throw 'Unknown Property';
                            }
                        }
                        return block;
                    }
                }
                else {
                    throw 'Unsupported Property of Property';
                }
            }
        }
        else if (node.expression.type === 'CallExpression') {
            const callee = node.expression.callee;
            if (callee.type === 'MemberExpression') {
                if (callee.object.type === 'ThisExpression') {
                    // this.xxx();
                    if (callee.property.type === 'Identifier') {
                        const block = this.useCodeRule(
                            CodeRuleType.CallProperty,
                            callee.property.name, node.expression, isAwait
                        );
                        if (!block) {
                            throw 'Unknown Method';
                        }
                        return block;
                    }
                }
                throw 'Unsupported Property of Property';
            }
        }
        throw 'Unknown Expression Statement Type';
    }

    public parseExpressionOrLiteralToInput(
        node: type.Expression, shadow?: boolean, shadowType?: string, fieldName?: string
    ): BlockInput {
        const input = new BlockInput();
        if (shadow && (
            node.type === 'StringLiteral' || node.type === 'BigIntLiteral' ||
            node.type === 'NumericLiteral' || node.type === 'DecimalLiteral'
        )) {
            input.shadow = new BlockShadow();
            input.shadow.fieldName = fieldName;
            input.shadow.id = generateBlockID();
            input.shadow.type = shadowType;
            input.shadow.value = node.value;
        }
        else {
            if (shadow) {
                input.shadow = new BlockShadow();
                input.shadow.fieldName = fieldName;
                input.shadow.id = generateBlockID();
                input.shadow.type = shadowType;
                input.shadow.value = '';
            }
            input.block = this.parseExpression(node);
        }
        return input;
    }

    public parseExpression(node: type.Expression): Block {
        if (node.type === 'BinaryExpression') {
            const operator = node.operator;

            const block = new Block();
            block.id = generateBlockID();
            if (operator === '+') {
                // @todo: string add
                block.opcode = 'operator_add';
                block.inputs.set('NUM1', this.parseExpressionOrLiteralToInput(
                    <type.Expression>node.left, true, 'math_number', 'NUM'
                ));
                block.inputs.set('NUM2', this.parseExpressionOrLiteralToInput(
                    node.right, true, 'math_number', 'NUM'
                ));
            }
            else if (operator === '-' || operator === '*' || operator === '/') {
                if (operator === '-') block.opcode = 'operator_substract';
                else if (operator === '*') block.opcode = 'operator_multiply';
                else if (operator === '/') block.opcode = 'operator_divide';
                block.inputs.set('NUM1', this.parseExpressionOrLiteralToInput(
                    <type.Expression>node.left, true, 'math_number', 'NUM'
                ));
                block.inputs.set('NUM2', this.parseExpressionOrLiteralToInput(
                    node.right, true, 'math_number', 'NUM'
                ));
            }
            else if (operator === '<' || operator === '>' || operator === '==') {
                if (operator === '<') block.opcode = 'operator_lt';
                else if (operator === '>') block.opcode = 'operator_gt';
                else if (operator === '==') block.opcode = 'operator_equals';
                block.inputs.set('OPERAND1', this.parseExpressionOrLiteralToInput(
                    <type.Expression>node.left, true, 'text', 'TEXT'
                ));
                block.inputs.set('OPERAND2', this.parseExpressionOrLiteralToInput(
                    node.right, true, 'text', 'TEXT'
                ));
            }
            else {
                throw 'Unknown Binary Expression';
            }
            return block;
        }
        else if (node.type === 'UnaryExpression') {
            const operator = node.operator;

            const block = new Block();
            block.id = generateBlockID();
            if (operator === '!') {
                block.opcode = 'operator_not';
                block.inputs.set('OPERAND', this.parseExpressionOrLiteralToInput(
                    node.argument, false
                ));
            }
            else {
                throw 'Unknown Unary Expression';
            }
            return block;
        }
        else if (node.type === 'MemberExpression') {
            if (node.object.type === 'ThisExpression') {
                // this.xxx = xxx;
                if (node.property.type === 'Identifier') {
                    const block = this.useCodeRule(
                        CodeRuleType.GetProperty,
                        node.property.name, node
                    );
                    if (!block) {
                        // check if this is variable
                        const variable = this.script.findVariableByIdentifier(node.property.name);
                        if (variable) {
                            const block = new Block();
                            block.id = generateBlockID();
                            block.opcode = 'data_variable';
                            const field = new BlockField();
                            field.id = generateBlockID();
                            field.value = variable.name;
                            block.fields.set('VARIABLE', field);
                            return block;
                        }
                        else {
                            throw 'Unknown Property';
                        }
                    }
                    return block;
                }
            }
            else {
                throw 'Unsupported Property of Property';
            }
        }
        else {
            console.log(node);
            throw 'Unknown Expression Type';
        }
    }

    /*
    public parseMemberExpression(node: estree.MemberExpression): CodeStatement {
        const result = new CodeStatement();
        result.type = CodeStatementType.MemberList;
        
        let curNode = node;
        while (curNode.object.type === 'MemberExpression') {
            result.data.unshift((<estree.Identifier>curNode.object.property).name);
            curNode = curNode.object;
        }

        return result;
    }
    */
}

export default CodeParser;
