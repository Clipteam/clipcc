const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();

const data = require('../fixtures/data');
const parser = require('../../index');

// Run suite
suite
    .add({
        name: 'JSON - Empty',
        defer: true,
        fn: function (deferred) {
            parser(data.empty.json, () => {
                deferred.resolve();
            });
        }
    })
    .add({
        name: 'SB2 - Empty',
        defer: true,
        fn: function (deferred) {
            parser(data.empty.sb2, () => {
                deferred.resolve();
            });
        }
    })
    .add({
        name: 'JSON - Example',
        defer: true,
        fn: function (deferred) {
            parser(data.example.json, () => {
                deferred.resolve();
            });
        }
    })
    .add({
        name: 'SB2 - Example',
        defer: true,
        fn: function (deferred) {
            parser(data.example.sb2, () => {
                deferred.resolve();
            });
        }
    })
    .on('cycle', event => {
        process.stdout.write(`${String(event.target)}\n`);
    })
    .run({
        async: false,
        minSamples: 100,
        delay: 2
    });
