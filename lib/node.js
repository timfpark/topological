const async = require('async');

class Node {
    constructor(options) {
        for (let key in options) {
            this[key] = options[key];
        }

        this.messagesProcessing = 0;
        this.started = false;
        this.paused = false;
        this.prefetchBuffer = [];
        this.parallelism = this.parallelism || 5;
        this.prefetchCount = this.parallelism;
    }

    output(messages, callback) {
        this.outputTo(null, messages, callback);
    }

    outputTo(connectionIds, messages, callback) {
        async.each(this.outputs, (output, outputCallback) => {
            if (connectionIds && connectionIds.indexOf(output.id) === -1) {
                return outputCallback();
            }

            output.enqueue(messages, outputCallback);
        }, callback);
    }

    complete(message, success) {
        this.messagesProcessing -= 1;

        if (success) {
            message.input.succeeded(message, err => {
                if (err) console.log(`${this.id}: failed to mark message succeeded: ${err}`);
            });
        } else {
            message.input.failed(message, err => {
                if (err) console.log(`${this.id}: failed to mark message failed: ${err}`);
            });
        }

        this.dispatch();
    }

    dispatch() {
        if (this.messagesProcessing < this.parallelism && this.prefetchBuffer.length > 0) {
            let message = this.prefetchBuffer.shift();
            this.messagesProcessing += 1;
            this.process(message);
        }

        console.log(`${this.id}: dispatch: ${this.messagesProcessing} / ${this.parallelism} processing, ${this.prefetchBuffer.length} buffered.`)

        if (this.paused && this.prefetchBuffer.length < this.prefetchCount) {
            console.log(`${this.id}: resuming message flow`);
            this.paused = false;
            async.each(this.inputs, (input, inputCallback) => {
                input.resume(inputCallback);
            }, err => {
                if (err) return console.log(`${input.id}: error resuming input: ${err}`);
            });
        }
    }

    buffer(message) {
        this.prefetchBuffer.push(message);

        if (!this.paused && this.parallelism && this.prefetchBuffer.length > this.prefetchCount) {
            console.log(`${this.id}: pausing message flow`);
            this.paused = true;
            async.each(this.inputs, (input, inputCallback) => {
                input.pause(inputCallback);
            }, err => {
                if (err) return console.log(`${input.id}: error pausing input: ${err}`);
            });
        }

        this.dispatch();
    }

    process(message) {
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
                        console.log(`${this.id}: message process failed with: ${err}`);
                        console.log(`${this.id}: retrying, attempts left: ${retriesLeft}, backing off: ${backoff}`);
                        return setTimeout(retryCallback, backoff);
                    }
                });
            }, err => {
                this.complete(message, !!!err);
            }
        );
    }

    startStreaming(callback) {
        async.each(this.inputs, (input, inputCallback) => {
            console.log(`${this.id}: starting message processing for input ${input.id}`);

            input.stream((err, message) => {
                if (err) return console.log(`${input.id}: stream reported error: ${err}`);
                if (!message) return console.log(`${input.id}: null message received by node.`);

                message.input = input;
                this.buffer(message);
            });

            return callback();
        }, callback);
    }

    startConnections(callback) {
        async.series([
            inputsCallback => {
                async.each(this.inputs, (input, inputCallback) => {
                    console.log(`${this.id}: starting input: ${input.id}`);
                    input.start(inputCallback);
                }, inputsCallback);
            },
            outputsCallback => {
                async.each(this.outputs, (output, outputCallback) => {
                    console.log(`${this.id}: starting output: ${output.id}`);
                    output.start(outputCallback);
                }, outputsCallback);
            }
        ], callback);
    }

    start(callback) {
        if (this.started) {
            console.log(`${this.id}: node already started.`);
            return callback();
        }

        console.log(`${this.id}: starting node.`);
        this.startConnections(err => {
            if (err) {
                console.log(`${this.id}: connections start failed: ${err}`);
                return callback(err);
            }

            this.processor.parentNode = this;
            this.processor.start(err => {
                if (err) {
                    console.log(`${this.id}: processor start failed: ${err}`);
                    return callback(err);
                }

                this.started = true;
                this.startStreaming(callback);
            });
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
