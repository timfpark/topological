const { Connection } = require("../core");

class DirectConnection extends Connection {
    constructor(config) {
        super(config);

        this.waitingDequeue = null;
    }

    start(callback) {
        this.messages = [];
        return callback();
    }

    failed(message, callback) {
        this.enqueue(message, callback);
    }

    enqueue(messages, callback) {
        console.log(`${this.name}: enqueuing ${JSON.stringify(messages)}`);
        this.messages = this.messages.concat(messages);

        if (this.waitingDequeue) {
            this.dequeue(this.waitingDequeue);
        }

        return callback();
    }

    dequeue(callback) {
        if (this.messages.length > 0) {
            let message = this.messages.shift();
            console.log(`${this.name}: dequeuing ${JSON.stringify(message)}`);
            return callback(null, message);
        } else {
            this.waitingDequeue = callback;
        }
    }
}

module.exports = DirectConnection;