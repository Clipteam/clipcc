const Data = require('../../src/blocks/scratch3_data');

const blocks = new Data();

const lists = {};
const util = {
    target: {
        lookupOrCreateList (id, name) {
            if (!(name in lists)) {
                lists[name] = {value: []};
            }
            return lists[name];
        }
    }
};

test('getItemNumOfList returns the index of an item (basic)', () => {
    lists.list = {value: ['apple', 'taco', 'burrito', 'extravaganza']};
    const args = {ITEM: 'burrito', LIST: {name: 'list'}};
    const index = blocks.getItemNumOfList(args, util);
    expect(index).toBe(3);
});

test('getItemNumOfList returns 0 when an item is not found', () => {
    lists.list = {value: ['aaaaapple', 'burrito']};
    const args = {ITEM: 'jump', LIST: {name: 'list'}};
    const index = blocks.getItemNumOfList(args, util);
    expect(index).toBe(0);
});

test('getItemNumOfList uses Scratch comparison', () => {
    lists.list = {value: ['jump', 'Jump', '123', 123, 800]};
    const args = {LIST: {name: 'list'}};

    // Be case-insensitive:
    args.ITEM = 'Jump';
    expect(blocks.getItemNumOfList(args, util)).toBe(1);

    // Be type-insensitive:
    args.ITEM = 123;
    expect(blocks.getItemNumOfList(args, util)).toBe(3);
    args.ITEM = '800';
    expect(blocks.getItemNumOfList(args, util)).toBe(5);
});
