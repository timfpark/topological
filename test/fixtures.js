const IncrementProcessor = require('./incrementProcessor');

const DirectConnection = require('topological-direct');
const { Node, Topology } = require('../lib');

let inputConnection = new DirectConnection({
    id: "inputConnection"
});

let incrementProcessor = new IncrementProcessor({
    id: "incrementProcessor"
});

let outputConnection  = new DirectConnection({
    id: "outputConnection"
});

let incrementNode = new Node({
    id: 'incrementNumber',
    inputs: [inputConnection],
    processor: incrementProcessor,
    outputs: [outputConnection]
});

let topology = new Topology([
    incrementNode,
]);

module.exports = {
    incrementNode,
    incrementProcessor,
    inputConnection,
    outputConnection,
    topology,
};
