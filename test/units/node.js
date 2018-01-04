const assert = require('assert');
const fixtures = require('../fixtures');

describe('Node', function() {
    it('can start, process, and stop', done => {
        let messageCount = 0;
        fixtures.incrementNode.start(err => {
            assert(!err);

            fixtures.incrementNode.start(err => {
                assert(!err);

                fixtures.outputConnection.stream((err, message) => {
                    assert(!err);
                    assert(message);
                    assert.equal(message.body.number, 2);

                    messageCount += 1;
                    if (messageCount === 4) {
                        fixtures.incrementNode.stop(err => {
                            assert(!err);
                            fixtures.incrementNode.stop(err => {
                                assert(!err);

                                setImmediate(done);
                            });
                        });
                    }
                });

                for (let idx=0; idx < 3; idx++) {
                    fixtures.inputConnection.enqueue([{
                        number: 1
                    }], err => {
                        assert(!err);
                    });
                }

                fixtures.incrementNode.enqueueOutputMessagesTo(['outputConnection'], [{
                    body: {
                        number: 2
                    }
                }], err => {
                    assert(!err);
                });
            });
        });
    });
});
