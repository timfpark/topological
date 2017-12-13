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
                    assert(message.number, 2);

                    fixtures.incrementNode.stop(err => {
                        assert(!err);
                        fixtures.incrementNode.stop(err => {
                            assert(!err);

                            done();
                        });
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
