const async = require('async');

class Node {
    constructor(options) {
        for (let key in options) {
            this[key] = options[key];
        }

        this.outstandingMessages = 0;
        this.started = false;
    }

    dequeueInputMessage(input, callback) {
        input.dequeue((err, message) => {
            if (err) {
                console.log(`${this.id}: error: ${err}`);
            }

            return callback(err, message);
        });
    }

    enqueueOutputMessages(messages, callback) {
        async.each(this.outputs, (output, outputCallback) => {
            output.enqueue(messages, outputCallback);
        }, callback);
    }

    processMessage(input, message) {
        this.processor.process(message, err => {
            if (err) {
                input.failed(message);
            } else {
                input.completed(message);
            }
            this.outstandingMessages -= 1;
        });
    }

    startMessageProcessing(callback) {
        async.each(this.inputs, (input, inputCallback) => {
            console.log(`${this.id}: starting message loop for input ${input.id}`);

            async.whilst(
                () => { return this.started; },
                messageCallback => {
                    console.log('starting attempt to dequeue message');
                    this.dequeueInputMessage(input, (err, message) => {
                        if (err) {
                            console.log('dequeueInputMessage failed with: ' + err);
                            return messageCallback();
                        }

                        this.outstandingMessages += 1;

                        console.log(`${this.id}: processing ${JSON.stringify(message)}: ` + this.outstandingMessages + " in progress.");
                        this.processMessage(input, message);

                        return messageCallback();
                    });
                }, err => {
                    console.log(`${this.id}: message loop for input ${input.id} stopping. err + ` + err);
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
            console.log(`${this.id}: node already started.`);
            return callback();
        }

        console.log(`${this.id}: starting node.`);
        this.startChildren(err => {
            if (err) return callback(err);

            this.processor.parentNode = this;
            this.started = true;
            this.startMessageProcessing(callback);
        });
    }

    stop(callback) {
        if (!this.started) {
            console.log(`${this.id}: node already stopped.`);
            return callback();
        }

        console.log(`${this.id}: stopping node.`);

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
