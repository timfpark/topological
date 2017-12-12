const IncrementProcessor = require('./incrementProcessor');

const { DirectConnection } = require('../connectors');
const { Node, Topology } = require('../core');

let inputConnection = new DirectConnection({
    name: "inputConnection"
});

let incrementProcessor = new IncrementProcessor({
    name: "incrementProcessor"
});

let outputConnection  = new DirectConnection({
    name: "outputConnection"
});

let incrementNode = new Node({
    name: 'incrementNumber',
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
