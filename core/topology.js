const async = require('async');

class Topology {
    constructor(nodes) {
        this.nodes = nodes;
    }

    start(callback) {
        console.log('topology start');
        async.each(this.nodes, (node, nodeCallback) => {
            node.start(nodeCallback);
        }, callback);
    }
}

module.exports = Topology;