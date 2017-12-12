const { Processor } = require('../core');

class IncrementProcessor extends Processor {
    process(message, callback) {
        message.number += 1;
        this.emit([message], callback);
    }
}

module.exports = IncrementProcessor;