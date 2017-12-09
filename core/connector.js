class Connector {
    constructor(config) {
        this.config = config;
    }

    complete(message, callback) {
        return callback();
    }

    dequeue(callback) {
        return callback();
    }

    enqueue(messages, callback) {
        return callback();
    }

    start(callback) {
        return callback();
    }

    stop(callback) {
        return callback();
    }
}

module.exports = Connector;