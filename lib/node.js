const async = require('async');

class Node {
    constructor(options) {
        for (let key in options) {
            this[key] = options[key];
        }

        this.started = false;
    }

    dequeueInputMessage(input, callback) {
        input.dequeue((err, message) => {
            if (err) {
                console.log(`${this.name}: error: ${err}`);
            }

            return callback(err, message);
        });
    }

    enqueueOutputMessages(messages, callback) {
        async.each(this.outputs, (output, outputCallback) => {
            output.enqueue(messages, outputCallback);
        }, callback);
    }

    startMessageProcessing(callback) {
        async.each(this.inputs, (input, inputCallback) => {
            console.log(`${this.name}: starting message loop for input ${input.name}`);
            async.whilst(
                () => { return this.started; },
                messageCallback => {
                    this.dequeueInputMessage(input, (err, message) => {
                        if (err) return messageCallback();

                        console.log(`${this.name}: processing ${JSON.stringify(message)}`);

                        this.processor.process(message, err => {
                            if (err) return input.failed(message, messageCallback);

                            input.completed(message, messageCallback);
                        });
                    });
                }, (err, n) => {
                    console.log(`${this.name}: message loop for input ${input.name} stopping.`);
                }
            );

            return inputCallback();
        }, callback);
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
        if (this.started) {
            console.log(`${this.name}: node already started.`);
            return callback();
        }

        console.log(`${this.name}: starting node.`);
        this.startChildren(err => {
            if (err) return callback(err);

            this.processor.parentNode = this;
            this.started = true;
            this.startMessageProcessing(callback);
        });
    }

    stop(callback) {
        if (!this.started) {
            console.log(`${this.name}: node already stopped.`);
            return callback();
        }

        console.log(`${this.name}: stopping node.`);

        this.started = false;

        async.series([
            inputsCallback => {
                async.each(this.inputs, (input, inputCallback) => {
                    input.stop(inputCallback);
                }, inputsCallback);
            },
            outputsCallback => {
                async.each(this.outputs, (output, outputCallback) => {
                    output.stop(outputCallback);
                }, outputsCallback);
            },
            processorCallback => {
                this.processor.stop(processorCallback);
            }
        ], callback);
    }
}

module.exports = Node;