const mutationAdapter = mutation => ({
    tagName: 'mutation',
    children: [],
    ...JSON.parse(mutation)
});

module.exports = mutationAdapter;
