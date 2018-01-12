const async = require('async'),
      Log = require('./log');

class Topology {
    constructor(options) {
        for (let key in options) {
            this[key] = options[key];
        }

        this.log = this.log || new Log({
            id: 'topology',
            level: 'info'
        });

        this.started = false;
    }

    start(callback) {
        if (this.started) {
            this.log.warn(`topology already started`);
            return callback();
        }

        this.log.debug(`starting`);

        async.each(this.nodes, (node, nodeCallback) => {
            node.log = this.log.clone(node.id);
            node.start(nodeCallback);
        }, err => {
            if (err) return callback(err);

            this.log.info(`started`);
            this.started = true;
            if (callback) return callback();
        });
    }

    stop(callback) {
        if (!this.started) {
            this.log.warn(`topology already stopped`);
            return callback();
        }

        this.log.debug(`stopping`);

        async.each(this.nodes, (node, nodeCallback) => {
            node.stop(nodeCallback);
        }, err => {
            if (err) return callback(err);

            this.started = false;
            this.log.info(`stopped`);
            if (callback) return callback();
        });
    }
}

module.exports = Topology;