const Log = require('./log');

class Connection {
    constructor(options) {
        for (let key in options) {
            this[key] = options[key];
        }
        this.started = false;
        this.paused = false;

        // if we are running this connection in isolation, say during a test, then configure a logger for it.
        this.log =
            this.log ||
            new Log({
                id: this.id
            });
    }

    start(callback) {
        this.started = true;
        return callback();
    }

    stop(callback) {
        this.started = false;
        return callback();
    }

    enqueue(messages, callback) {
        return callback();
    }

    stream(callback) {
        return callback();
    }

    succeeded(message, callback) {
        if (callback) return callback();
    }

    failed(message, callback) {
        if (callback) return callback();
    }

    pause(callback) {
        this.paused = true;
        if (callback) return callback();
    }

    resume(callback) {
        this.paused = false;
        if (callback) return callback();
    }
}

module.exports = Connection;
