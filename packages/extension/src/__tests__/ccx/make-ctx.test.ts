import {
    ExtensionCentralAPI,
    makeUnsandboxedCtx,
    makeCtxForWorker
} from '../../adapter/ccx/make-ctx';
import type { CCXAdapter } from '../../adapter/ccx/ccx';
import { ParameterType } from '../../type/ccx/type';

const fakeAdapter = {
    emit: jest.fn(),
    guiSettings: {}
} as unknown as CCXAdapter;

describe('category', () => {
    const api = new ExtensionCentralAPI(fakeAdapter);
    test('add category twice', (done) => {
        api.addCategory({
            categoryId: 'fake.category',
            messageId: 'fake.category',
            color: '#000000'
        });
        expect(() => {
            api.addCategory({
                categoryId: 'fake.category',
                messageId: 'fake.category',
                color: '#000000'
            });
        }).toThrow(new Error('cannot add a category twice'));
        // Refresh toolbox will be triggered in next event loop
        queueMicrotask(() => {
            expect(api.adapter.emit).lastCalledWith('REFRESH_TOOLBOX');
            done();
        });
    });

    test('remove category then add same', () => {
        api.removeCategory('fake.category');
        api.addCategory({
            categoryId: 'fake.category',
            messageId: 'fake.category',
            color: '#000000'
        });
    });
});

describe('block', () => {
    const api = new ExtensionCentralAPI(fakeAdapter);
    test('add block to non-existed category', (done) => {
        expect(() => {
            api.addBlock({
                categoryId: 'fake.category',
                opcode: 'fake.block1',
                messageId: 'fake.block1',
                type: 1,
                function: jest.fn()
            });
        }).toThrow(new Error('category not found'));
        api.addCategory({
            categoryId: 'fake.category',
            messageId: 'fake.category',
            color: '#000000'
        });
        api.addBlock({
            categoryId: 'fake.category',
            opcode: 'fake.block1',
            messageId: 'fake.block1',
            type: 1,
            function: 'testServiceName'
        });
        expect(api.adapter.emit).nthCalledWith(1, 'REGISTER_BLOCK', [
            {
                args0: [],
                category: 'fake.category',
                colour: '#000000',
                colourSecondary: undefined,
                colourTertiary: undefined,
                inputsInline: true,
                message0: 'fake.block1',
                nextStatement: null,
                outputShape: 3,
                previousStatement: null,
                type: 'fake.block1'
            }
        ]);
        // Refresh toolbox will be triggered in next event loop
        queueMicrotask(() => {
            expect(api.adapter.emit).lastCalledWith('REFRESH_TOOLBOX');
            done();
        });
    });

    // adding blocks twice does not throw an error,
    // although this should only be done when updating locales.
    test('add blocks twice', () => {
        api.addBlocks([{
            categoryId: 'fake.category',
            opcode: 'fake.block1',
            messageId: 'fake.block1',
            type: 2,
            function: jest.fn()
        }, {
            categoryId: 'fake.category',
            opcode: 'fake.block2',
            messageId: 'fake.block2',
            type: 1,
            function: jest.fn()
        }]);
        expect(api.adapter.emit).nthCalledWith(1, 'REGISTER_BLOCK', [
            {
                args0: [],
                category: 'fake.category',
                colour: '#000000',
                colourSecondary: undefined,
                colourTertiary: undefined,
                inputsInline: true,
                message0: 'fake.block1',
                output: 'String',
                outputShape: 2,
                type: 'fake.block1'
            }, {
                args0: [],
                category: 'fake.category',
                colour: '#000000',
                colourSecondary: undefined,
                colourTertiary: undefined,
                inputsInline: true,
                message0: 'fake.block2',
                nextStatement: null,
                outputShape: 3,
                previousStatement: null,
                type: 'fake.block2'
            }
        ]);
        const xml1 = api.getBlocksXML()[0].xml;
        expect(xml1).toBe(`<category
                name="fake.category"
                id="fake.category"
                colour="#000000"
                secondaryColour="undefined"
            ><block type="fake.block1" ></block><block type="fake.block2" ></block></category>`
        );
    });

    test('remove blocks', () => {
        expect(() => {
            api.removeBlock('fake.test')
        }).toThrow(new Error('cannot find block'));
        api.removeBlocks(['fake.block1', 'fake.block2']);
        // hide from toolbox
        const xml2 = api.getBlocksXML()[0].xml;
        expect(xml2).toBe(`<category
                name="fake.category"
                id="fake.category"
                colour="#000000"
                secondaryColour="undefined"
            ></category>`
        );
    });
});
