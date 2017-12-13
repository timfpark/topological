const async = require('async');

class Topology {
    constructor(options) {
        for (let key in options) {
            this[key] = options[key];
        }
        this.started = false;
    }

    start(callback) {
        if (this.started) {
            console.log(`${this.name}: topology already started`);
            return callback();
        }

        console.log(`${this.name}: starting topology`);

        async.each(this.nodes, (node, nodeCallback) => {
            node.start(nodeCallback);
        }, err => {
            if (err) return callback(err);

            this.started = true;
            return callback();
        });
    }

    stop(callback) {
        if (!this.started) {
            console.log(`${this.name}: topology already stopped`);
            return callback();
        }

        console.log(`${this.name}: stopping topology`);

        async.each(this.nodes, (node, nodeCallback) => {
            node.stop(nodeCallback);
        }, err => {
            if (err) return callback(err);

            this.started = false;
            return callback();
        });
    }
}

module.exports = Topology;