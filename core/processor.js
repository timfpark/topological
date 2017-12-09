const async = require('async');

class Processor {
    constructor(options) {
        this.name = options.name;
    }

    process(message, done) {
        return done();
    }

    emit(message, done) {
        async.each(this.outputs, (output, outputCallback) => {
            output.queue(message, outputCallback);
        }, done);
    }

    start(done) {
        return done();
    }

    stop(done) {
        return done();
    }
}

module.exports = Processor;