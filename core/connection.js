class Connection {
    constructor(options) {
        for (let key in options) {
            this[key] = options[key];
        }
    }

    complete(message, callback) {
        return callback();
    }

    failed(message, callback) {
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

module.exports = Connection;