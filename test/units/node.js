const assert = require('assert');
const fixtures = require('../fixtures');

describe('Node', function() {
    it('can start, process, and stop', done => {
        fixtures.incrementNode.start(err => {
            assert(!err);

            fixtures.incrementNode.start(err => {
                assert(!err);

                fixtures.outputConnection.dequeue((err, message) => {
                    assert(!err);
                    assert(message);
                    assert.equal(message.body.number, 2);

                    fixtures.outputConnection.dequeue((err, message) => {
                        assert(!err);
                        assert(message);
                        console.dir(message);
                        assert(message.worked);

                        fixtures.incrementNode.stop(err => {
                            assert(!err);
                            fixtures.incrementNode.stop(err => {
                                assert(!err);

                                setImmediate(done);
                            });
                        });
                    });

                    fixtures.incrementNode.enqueueOutputMessagesTo(['outputConnection'], [{
                        worked: true
                    }], err => {
                        assert(!err);
                    });
                });


                fixtures.inputConnection.enqueue([{
                    number: 1
                }], err => {
                    assert(!err);
                });
            });
        });
    });
});
