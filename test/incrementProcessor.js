const { Processor } = require('../lib');

class IncrementProcessor extends Processor {
    process(message, callback) {
        message.number += 1;
        this.emit([message], callback);
    }
}

module.exports = IncrementProcessor;