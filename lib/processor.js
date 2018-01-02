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

    objectsToMessages(objects) {
        return objects.map(object => {
            return {
                body: object
            };
        });
    }

    outputMessages(messages, callback) {
        this.parentNode.enqueueOutputMessages(messages, callback);
    }

    output(objects, callback) {
        this.outputMessages(this.objectsToMessages(objects), callback);
    }

    outputTo(connectionIds, objects, callback) {
        this.parentNode.enqueueOutputMessagesTo(connectionIds, this.objectsToMessages(objects), callback);
    }

    start(callback) {
        return callback();
    }

    stop(callback) {
        return callback();
    }
}

module.exports = Processor;