const async = require('async');

class Topology {
    constructor(options) {
        for (let key in options) {
            this[key] = options[key];
        }
    }

    start(callback) {
        console.log('topology start');
        async.each(this.nodes, (node, nodeCallback) => {
            node.start(nodeCallback);
        }, callback);
    }
}

module.exports = Topology;