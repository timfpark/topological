const assert = require('assert');
const fixtures = require('../fixtures');

describe('Topology', function() {
    it('can start, process, and stop', done => {
        fixtures.topology.start(err => {
            assert(!err);

            fixtures.topology.start(err => {
                assert(!err);

                fixtures.outputConnection.stream((err, message) => {
                    assert(!err);
                    assert(message);
                    assert.equal(message.body.number, 2);

                    fixtures.topology.stop(err => {
                        assert(!err);

                        fixtures.topology.stop(err => {
                            assert(!err);

                            setImmediate(done);
                        });
                    });
                });

                fixtures.inputConnection.enqueue([{
                    body: {
                        number: 1
                    }
                }], err => {
                    assert(!err);
                });
            });
        });
    });
});
