const async = require('async');

class Processor {
    constructor(options) {
        for (let key in options) {
            this[key] = options[key];
        }
    }

    process(message, callback) {
        return callback();
    }

    output(messages, callback) {
        this.parentNode.enqueueOutputMessages(messages, callback);
    }

    start(callback) {
        return callback();
    }

    stop(callback) {
        return callback();
    }
}

module.exports = Processor;