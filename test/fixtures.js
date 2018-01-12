const IncrementProcessor = require('./incrementProcessor');

const DirectConnection = require('topological-direct');
const { Log, Node, Topology } = require('../lib');

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
    parallelism: 2,
    log: new Log({
        severity: 'debug'
    }),
    inputs: [inputConnection],
    processor: incrementProcessor,
    outputs: [outputConnection]
});

let topology = new Topology({
    id: 'topology',
    log: new Log({
        id: 'topology',
        severity: 'debug'
    }),
    nodes: [ incrementNode ]
});

module.exports = {
    incrementNode,
    incrementProcessor,
    inputConnection,
    outputConnection,
    topology,
};
