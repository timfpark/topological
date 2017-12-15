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
            console.log(`${this.id}: topology already started`);
            return callback();
        }

        console.log(`${this.id}: starting topology`);

        async.each(this.nodes, (node, nodeCallback) => {
            node.start(nodeCallback);
        }, err => {
            if (err) return callback(err);

            this.started = true;
            if (callback) return callback();
        });
    }

    stop(callback) {
        if (!this.started) {
            console.log(`${this.id}: topology already stopped`);
            return callback();
        }

        console.log(`${this.id}: stopping topology`);

        async.each(this.nodes, (node, nodeCallback) => {
            node.stop(nodeCallback);
        }, err => {
            if (err) return callback(err);

            this.started = false;
            if (callback) return callback();
        });
    }
}

module.exports = Topology;