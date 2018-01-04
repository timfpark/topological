const { Processor } = require('../lib');

class IncrementProcessor extends Processor {
    process(message, callback) {
        if (Math.random() < 0.1) return callback("fake error");

        message.number += 1;

        // fake processing time
        setTimeout(() => {
            this.output([message], callback);
        }, 1000);
    }
}

module.exports = IncrementProcessor;