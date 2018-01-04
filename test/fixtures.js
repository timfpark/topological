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
    targetParallelism: 2,
    inputs: [inputConnection],
    processor: incrementProcessor,
    outputs: [outputConnection]
});

let topology = new Topology({
    id: 'topology',
    nodes: [ incrementNode ]
});

module.exports = {
    incrementNode,
    incrementProcessor,
    inputConnection,
    outputConnection,
    topology,
};
