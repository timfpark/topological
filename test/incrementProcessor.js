const { Processor } = require('../lib');

class IncrementProcessor extends Processor {
    process(message, callback) {
        if (Math.random() < 0.1) return callback("fake error");

        message.body.number += 1;

        // fake processing time
        setTimeout(() => {
            this.output([message.body], callback);
        }, 1000);
    }
}

module.exports = IncrementProcessor;