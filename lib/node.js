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
        let done = false;
        let retriesLeft = Math.max(1, this.retries || 5);
        let backoff = 1000;

        async.whilst(
            () => { return !done && retriesLeft > 0; },
            retryCallback => {
                this.processor.process(message, err => {
                    if (!err) {
                        done = true;
                        return retryCallback();
                    } else {
                        retriesLeft -= 1;
                        backoff *= 2;
                        console.log(`${this.id}: process failed.  retrying, attempts left: ${retriesLeft}, backing off: ${backoff}`);
                        return setTimeout(retryCallback, backoff);
                    }
                });
            }, err => {
                this.outstandingMessages -= 1;
                let outcome;
                if (err) {
                    outcome = "FAILED";
                    input.failed(message);
                } else {
                    outcome = "FINISHED";
                    input.complete(message);
                }
                console.log(`${this.id}: ${outcome} processing ${JSON.stringify(message.body)}: ${this.outstandingMessages} still in progress.`);
            }
        );
    }

    startMessageStreaming(input, callback) {
        input.stream((err, message) => {
            this.outstandingMessages += 1;
            console.log(`${this.id}: STARTING processing ${JSON.stringify(message.body)}: ${this.outstandingMessages} now in progress.`);

            this.processMessage(input, message);
        });

        return callback();
    }

    startMessageDequeueLoop(input, callback) {
        async.whilst(
            () => { return this.started; },
            messageCallback => {
                this.dequeueInputMessage(input, (err, message) => {
                    if (err) {
                        console.log('dequeueInputMessage failed with: ' + err);
                        return messageCallback();
                    }

                    this.outstandingMessages += 1;
                    console.log(`${this.id}: STARTING processing ${JSON.stringify(message.body)}: ${this.outstandingMessages} now in progress.`);

                    this.processMessage(input, message);

                    return messageCallback();
                });
            }, err => {
                console.log(`${this.id}: message loop for input ${input.id} stopping. err: ${err}`);
            }
        );

        return callback();
    }

    startMessageProcessing(callback) {
        async.each(this.inputs, (input, inputCallback) => {
            console.log(`${this.id}: starting message processing for input ${input.id}`);

            if (input.supportsStreaming)
                this.startMessageStreaming(input, callback);
            else
                this.startMessageDequeueLoop(input, callback);

        }, callback);
    }

    startChildren(callback) {
        async.series([
            inputsCallback => {
                async.each(this.inputs, (input, inputCallback) => {
                    console.log(`starting input ${input.id}`);
                    input.start(inputCallback);
                }, inputsCallback);
            },
            outputsCallback => {
                async.each(this.outputs, (output, outputCallback) => {
                    console.log(`starting output ${output.id}`);
                    output.start(outputCallback);
                }, outputsCallback);
            },
            processorCallback => {
                console.log(`starting processor ${this.processor.id}`);
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
