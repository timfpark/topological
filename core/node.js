const async = require('async');

const DEQUEUE_TIMEOUT = 500;

class Node {
    constructor(node) {
        this.inputs = node.inputs;
        this.processor = node.processor;
        this.outputs = node.outputs;
        this.name = node.name;

        this.started = false;
    }

    dequeueInputMessage(input, callback) {
        input.dequeue((err, message) => {
            if (err) {
                console.log(`${this.name}: error: ${err}`);
            }

            if (!message) {
                console.log(`${this.name}: no messages`);
            }

            return callback(err, message);
        });
    }

    enqueueOutputMessages(messages, callback) {
        async.each(this.outputs, (output, outputCallback) => {
            output.enqueue(messages, outputCallback);
        }, callback);
    }

    messageLoop() {
        async.each(this.inputs, (input, inputCallback) => {
            console.log(`${this.name}: starting message loop`);
            async.whilst(
                () => {
                    return this.started;
                },
                messageCallback => {
                    this.dequeueInputMessage(input, (err, message) => {
                        if (err || !message) return setTimeout(() => { messageCallback(); }, DEQUEUE_TIMEOUT);

                        console.log(`${this.name}: processing ${JSON.stringify(message)}`);

                        this.processor.process(message, (err, outputMessages) => {
                            if (err || !message) return setTimeout(() => { messageCallback(); }, DEQUEUE_TIMEOUT);

                            this.enqueueOutputMessages(outputMessages, err => {
                                setImmediate(messageCallback);
                            });
                        });
                    });
                }, (err, n) => {
                    console.log(`${this.name}: message loop for input ${input.name} stopping.`);
                }
            );
        });
    }

    startChildren(callback) {
        async.series([
            inputsCallback => {
                async.each(this.inputs, (input, inputCallback) => {
                    input.start(inputCallback);
                }, inputsCallback);
            },
            outputsCallback => {
                async.each(this.outputs, (output, outputCallback) => {
                    output.start(outputCallback);
                }, outputsCallback);
            },
            processorCallback => {
                this.processor.start(processorCallback);
            }
        ], callback);
    }

    start(callback) {
        console.log(`${this.name}: starting`);
        this.startChildren(err => {
            if (err) return callback(err);

            this.started = true;
            this.messageLoop();

            return callback();
        });
    }

    stop(done) {
        this.started = false;

        async.series([
            inputCallback => {
                async.each(this.inputs, (input, inputCallback) => {
                    input.stop(inputCallback);
                }, done);
            },
            outputCallback => {
                async.each(this.outputs, (output, outputCallback) => {
                    output.stop(outputCallback);
                }, done);
            },
            processorCallback => {
                this.processor.stop(processorCallback);
            }
        ], callback);
    }
}

module.exports = Node;