const ArgumentType = require('../../src/extension-support/argument-type');
const BlockType = require('../../src/extension-support/block-type');
const Runtime = require('../../src/engine/runtime');
const ScratchBlocksConstants = require('../../src/engine/scratch-blocks-constants');

/**
 * @type {ExtensionMetadata}
 */
const testExtensionInfo = {
    id: 'test',
    name: 'fake test extension',
    color1: '#111111',
    color2: '#222222',
    color3: '#333333',
    blocks: [
        {
            func: 'MAKE_A_VARIABLE',
            blockType: BlockType.BUTTON,
            text: 'this is a button'
        },
        {
            opcode: 'reporter',
            blockType: BlockType.REPORTER,
            text: 'simple text',
            blockIconURI: 'invalid icon URI' // trigger the 'scratch_extension' path
        },
        {
            opcode: 'inlineImage',
            blockType: BlockType.REPORTER,
            text: 'text and [IMAGE]',
            arguments: {
                IMAGE: {
                    type: ArgumentType.IMAGE,
                    dataURI: 'invalid image URI'
                }
            }
        },
        '---', // separator between groups of blocks in an extension
        {
            opcode: 'command',
            blockType: BlockType.COMMAND,
            text: 'text with [ARG] [ARG_WITH_DEFAULT]',
            arguments: {
                ARG: {
                    type: ArgumentType.STRING
                },
                ARG_WITH_DEFAULT: {
                    type: ArgumentType.STRING,
                    defaultValue: 'default text'
                }
            }
        },
        {
            opcode: 'ifElse',
            blockType: BlockType.CONDITIONAL,
            branchCount: 2,
            text: [
                'test if [THING] is spiffy and if so then',
                'or elsewise'
            ],
            arguments: {
                THING: {
                    type: ArgumentType.BOOLEAN
                }
            }
        },
        {
            opcode: 'loop',
            blockType: BlockType.LOOP, // implied branchCount of 1 unless otherwise stated
            isTerminal: true,
            text: [
                'loopty [MANY] loops'
            ],
            arguments: {
                MANY: {
                    type: ArgumentType.NUMBER
                }
            }
        }
    ]
};

const extensionInfoWithCustomFieldTypes = {
    id: 'test_custom_fieldType',
    name: 'fake test extension with customFieldTypes',
    color1: '#111111',
    color2: '#222222',
    color3: '#333333',
    blocks: [
        { // Block that uses custom field types
            opcode: 'motorTurnFor',
            blockType: BlockType.COMMAND,
            text: '[PORT] run [DIRECTION] for [VALUE] [UNIT]',
            arguments: {
                PORT: {
                    defaultValue: 'A',
                    type: 'single-port-selector'
                },
                DIRECTION: {
                    defaultValue: 'clockwise',
                    type: 'custom-direction'
                }
            }
        }
    ],
    customFieldTypes: {
        'single-port-selector': {
            output: 'string',
            outputShape: 2,
            implementation: {
                fromJson: () => null
            }
        },
        'custom-direction': {
            output: 'string',
            outputShape: 3,
            implementation: {
                fromJson: () => null
            }
        }
    }
};

const testCategoryInfo = function (t, block) {
    expect(block.json.category).toBe('fake test extension');
    expect(block.json.colour).toBe('#111111');
    expect(block.json.colourSecondary).toBe('#222222');
    expect(block.json.colourTertiary).toBe('#333333');
    expect(block.json.inputsInline).toBe(true);
};

const testButton = function (t, button) {
    expect(button.json).toEqual(null); // should be null or undefined
    expect(button.xml).toBe('<button text="this is a button" callbackKey="MAKE_A_VARIABLE"></button>');
};

const testReporter = function (t, reporter) {
    expect(reporter.json.type).toBe('test_reporter');
    testCategoryInfo(t, reporter);
    expect(reporter.json.checkboxInFlyout).toBe(true);
    expect(reporter.json.outputShape).toBe(ScratchBlocksConstants.OUTPUT_SHAPE_ROUND);
    expect(reporter.json.output).toBe('String');
    expect(reporter.json.hasOwnProperty('previousStatement')).toBeFalsy();
    expect(reporter.json.hasOwnProperty('nextStatement')).toBeFalsy();
    expect(reporter.json.extensions).toEqual(['scratch_extension']);
    expect(reporter.json.message0).toBe('%1 %2simple text'); // "%1 %2" from the block icon
    expect(reporter.json.hasOwnProperty('message1')).toBeFalsy();
    expect(reporter.json.args0).toEqual([
        // %1 in message0: the block icon
        {
            type: 'field_image',
            src: 'invalid icon URI',
            width: 40,
            height: 40
        },
        // %2 in message0: separator between icon and text (only added when there's also an icon)
        {
            type: 'field_vertical_separator'
        }
    ]);
    expect(reporter.json.hasOwnProperty('args1')).toBeFalsy();
    expect(reporter.xml).toBe('<block type="test_reporter"></block>');
};

const testInlineImage = function (t, inlineImage) {
    expect(inlineImage.json.type).toBe('test_inlineImage');
    testCategoryInfo(t, inlineImage);
    expect(inlineImage.json.checkboxInFlyout).toBe(true);
    expect(inlineImage.json.outputShape).toBe(ScratchBlocksConstants.OUTPUT_SHAPE_ROUND);
    expect(inlineImage.json.output).toBe('String');
    expect(inlineImage.json.hasOwnProperty('previousStatement')).toBeFalsy();
    expect(inlineImage.json.hasOwnProperty('nextStatement')).toBeFalsy();
    expect(inlineImage.json.extensions && inlineImage.json.extensions.length).toBeFalsy(); // OK if it's absent or empty
    expect(inlineImage.json.message0).toBe('text and %1'); // block text followed by inline image
    expect(inlineImage.json.hasOwnProperty('message1')).toBeFalsy();
    expect(inlineImage.json.args0).toEqual([
        // %1 in message0: the block icon
        {
            type: 'field_image',
            src: 'invalid image URI',
            width: 24,
            height: 24,
            flip_rtl: false // False by default
        }
    ]);
    expect(inlineImage.json.hasOwnProperty('args1')).toBeFalsy();
    expect(inlineImage.xml).toBe('<block type="test_inlineImage"></block>');
};

const testSeparator = function (t, separator) {
    expect(separator.json).toEqual(null); // should be null or undefined
    expect(separator.xml).toBe('<sep gap="36"/>');
};

const testCommand = function (t, command) {
    expect(command.json.type).toBe('test_command');
    testCategoryInfo(t, command);
    expect(command.json.outputShape).toBe(ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE);
    expect(command.json.hasOwnProperty('previousStatement')).toBeTruthy();
    expect(command.json.hasOwnProperty('nextStatement')).toBeTruthy();
    expect(command.json.extensions && command.json.extensions.length).toBeFalsy(); // OK if it's absent or empty
    expect(command.json.message0).toBe('text with %1 %2');
    expect(command.json.hasOwnProperty('message1')).toBeFalsy();
    t.strictSame(command.json.args0[0], {
        type: 'input_value',
        name: 'ARG'
    });
    expect(command.json.hasOwnProperty('args1')).toBeFalsy();
    expect(command.xml).toBe(
        '<block type="test_command"><value name="ARG"><shadow type="text"></shadow></value>' +
        '<value name="ARG_WITH_DEFAULT"><shadow type="text"><field name="TEXT">' +
        'default text</field></shadow></value></block>'
    );
};

const testConditional = function (t, conditional) {
    expect(conditional.json.type).toBe('test_ifElse');
    testCategoryInfo(t, conditional);
    expect(conditional.json.outputShape).toBe(ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE);
    expect(conditional.json.hasOwnProperty('previousStatement')).toBeTruthy();
    expect(conditional.json.hasOwnProperty('nextStatement')).toBeTruthy();
    expect(conditional.json.extensions && conditional.json.extensions.length).toBeFalsy(); // OK if it's absent or empty
    expect(conditional.json.message0).toBe('test if %1 is spiffy and if so then');
    expect(conditional.json.message1).toBe('%1'); // placeholder for substack #1
    expect(conditional.json.message2).toBe('or elsewise');
    expect(conditional.json.message3).toBe('%1'); // placeholder for substack #2
    expect(conditional.json.hasOwnProperty('message4')).toBeFalsy();
    t.strictSame(conditional.json.args0[0], {
        type: 'input_value',
        name: 'THING',
        check: 'Boolean'
    });
    t.strictSame(conditional.json.args1[0], {
        type: 'input_statement',
        name: 'SUBSTACK'
    });
    expect(conditional.json.hasOwnProperty(conditional.json.args2)).toBeFalsy();
    t.strictSame(conditional.json.args3[0], {
        type: 'input_statement',
        name: 'SUBSTACK2'
    });
    expect(conditional.json.hasOwnProperty('args4')).toBeFalsy();
    expect(conditional.xml).toBe('<block type="test_ifElse"><value name="THING"></value></block>');
};

const testLoop = function (t, loop) {
    expect(loop.json.type).toBe('test_loop');
    testCategoryInfo(t, loop);
    expect(loop.json.outputShape).toBe(ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE);
    expect(loop.json.hasOwnProperty('previousStatement')).toBeTruthy();
    expect(loop.json.hasOwnProperty('nextStatement')).toBeFalsy(); // isTerminal is set on this block
    expect(loop.json.extensions && loop.json.extensions.length).toBeFalsy(); // OK if it's absent or empty
    expect(loop.json.message0).toBe('loopty %1 loops');
    expect(loop.json.message1).toBe('%1'); // placeholder for substack
    expect(loop.json.message2).toBe('%1'); // placeholder for loop arrow
    expect(loop.json.hasOwnProperty('message3')).toBeFalsy();
    t.strictSame(loop.json.args0[0], {
        type: 'input_value',
        name: 'MANY'
    });
    t.strictSame(loop.json.args1[0], {
        type: 'input_statement',
        name: 'SUBSTACK'
    });
    expect(loop.json.lastDummyAlign2).toBe('RIGHT'); // move loop arrow to right side
    expect(loop.json.args2[0].type).toBe('field_image');
    expect(loop.json.args2[0].flip_rtl).toBe(true);
    expect(loop.json.hasOwnProperty('args3')).toBeFalsy();
    expect(loop.xml).toBe(
        '<block type="test_loop"><value name="MANY"><shadow type="math_number"></shadow></value></block>'
    );
};

test('registerExtensionPrimitives', done => {
    const runtime = new Runtime();

    runtime.on(Runtime.EXTENSION_ADDED, categoryInfo => {
        const blocksInfo = categoryInfo.blocks;
        expect(blocksInfo.length).toBe(testExtensionInfo.blocks.length);

        blocksInfo.forEach(blockInfo => {
            // `true` here means "either an object or a non-empty string but definitely not null or undefined"
            expect(blockInfo.info).toBeTruthy();
        });

        // Note that this also implicitly tests that block order is preserved
        const [button, reporter, inlineImage, separator, command, conditional, loop] = blocksInfo;

        testButton(t, button);
        testReporter(t, reporter);
        testInlineImage(t, inlineImage);
        testSeparator(t, separator);
        testCommand(t, command);
        testConditional(t, conditional);
        testLoop(t, loop);

        done();
    });

    runtime._registerExtensionPrimitives(testExtensionInfo);
});

test('custom field types should be added to block and EXTENSION_FIELD_ADDED callback triggered', () => {
    const runtime = new Runtime();

    runtime.on(Runtime.EXTENSION_ADDED, categoryInfo => {
        const blockInfo = categoryInfo.blocks[0];

        // We expect that for each argument there's a corresponding <field>-tag in the block XML
        Object.values(blockInfo.info.arguments).forEach(argument => {
            const regex = new RegExp(`<field name="field_${categoryInfo.id}_${argument.type}">`);
            expect(regex.test(blockInfo.xml)).toBeTruthy();
        });

    });

    let fieldAddedCallbacks = 0;
    runtime.on(Runtime.EXTENSION_FIELD_ADDED, () => {
        fieldAddedCallbacks++;
    });

    runtime._registerExtensionPrimitives(extensionInfoWithCustomFieldTypes);

    // Extension includes two custom field types
    expect(fieldAddedCallbacks).toBe(2);
});
