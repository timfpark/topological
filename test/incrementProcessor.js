const { Processor } = require('../lib');

class IncrementProcessor extends Processor {
    process(message, callback) {
        if (Math.random() < 0.1) return callback("fake error");

        message.number += 1;
        this.output([message], callback);
    }
}

module.exports = IncrementProcessor;