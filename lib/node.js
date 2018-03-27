const async = require('async'),
      promClient = require('prom-client');

const messagesBuffered = new promClient.Counter({ name: 'topological_messages_buffered', help: 'Total messages buffered.' });
const messagesProcessed = new promClient.Counter({ name: 'topological_messages_processed', help: 'Total messages processed.' });

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
                if (err) this.log.error(`failed to mark message succeeded: ${err}`);
            });
        } else {
            message.input.failed(message, err => {
                if (err) this.log.error(`failed to mark message failed: ${err}`);
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

        this.log.debug(`dispatch: ${this.messagesProcessing} / ${this.parallelism} processing, ${this.prefetchBuffer.length} buffered.`)

        if (this.paused && this.prefetchBuffer.length < this.prefetchCount) {
            this.log.debug(`resuming message flow`);
            this.paused = false;
            async.each(this.inputs, (input, inputCallback) => {
                input.resume(inputCallback);
            }, err => {
                if (err) return this.log.error(`error resuming input: ${err}`);
            });
        }
    }

    buffer(message) {
        this.prefetchBuffer.push(message);
        messagesBuffered.inc(1);

        if (!this.paused && this.parallelism && this.prefetchBuffer.length > this.prefetchCount) {
            this.log.info(`pausing message flow`);
            this.paused = true;
            async.each(this.inputs, (input, inputCallback) => {
                input.pause(inputCallback);
            }, err => {
                if (err) return this.log.error(`error pausing input: ${err}`);
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
                        messagesProcessed.inc(1);
                        return retryCallback();
                    } else {
                        retriesLeft -= 1;
                        backoff *= 2;
                        this.log.warn(`message process failed with: ${err}`);
                        this.log.warn(`retrying, attempts left: ${retriesLeft}, backing off: ${backoff}`);
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
            this.log.info(`starting message processing for input ${input.id}`);

            input.stream((err, message) => {
                if (err) return this.log.warn(`stream reported error: ${err}`);
                if (!message) return this.log.warn(`null message received by node.`);

                message.input = input;
                this.buffer(message);
            });

            return inputCallback();
        }, callback);
    }

    startConnections(callback) {
        async.series([
            inputsCallback => {
                async.each(this.inputs, (input, inputCallback) => {
                    this.log.info(`starting input: ${input.id}`);
                    input.log = this.log.clone(input.id);
                    input.start(inputCallback);
                }, inputsCallback);
            },
            outputsCallback => {
                async.each(this.outputs, (output, outputCallback) => {
                    this.log.info(`starting output: ${output.id}`);
                    output.log = this.log.clone(output.id);
                    output.start(outputCallback);
                }, outputsCallback);
            }
        ], callback);
    }

    start(callback) {
        if (this.started) {
            this.log.warn(`node already started.`);
            return callback();
        }

        this.log.info(`starting node.`);
        this.startConnections(err => {
            if (err) {
                this.log.error(`connections start failed: ${err}`);
                return callback(err);
            }

            this.processor.parentNode = this;
            this.processor.log = this.log.clone(this.id);
            this.processor.start(err => {
                if (err) {
                    this.log.error(`processor start failed: ${err}`);
                    return callback(err);
                }

                this.started = true;
                this.startStreaming(callback);
            });
        });
    }

    stop(callback) {
        if (!this.started) {
            this.log.warn(`node already stopped.`);
            return callback();
        }

        this.log.info(`stopping node.`);

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
