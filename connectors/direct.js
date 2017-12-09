const Connector = require("../core").Connector;

class DirectConnection extends Connector {
    constructor(config) {
        super(config);
    }

    start(callback) {
        this.messages = [];
        return callback();
    }

    enqueue(messages, callback) {
        this.messages = this.messages.concat(messages);
        return callback();
    }

    dequeue(callback) {
        return callback(null, this.messages.shift());
    }
}

module.exports = DirectConnection;