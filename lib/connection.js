class Connection {
    constructor(options) {
        for (let key in options) {
            this[key] = options[key];
        }
        this.supportsStreaming = false;
    }

    complete(message, callback) {
        if (callback) return callback();
    }

    failed(message, callback) {
        if (callback) return callback();
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

    // like dequeue, but callback will be called continously.
    stream(streamCallback) {
        return streamCallback();
    }
}

module.exports = Connection;