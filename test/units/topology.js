const assert = require('assert');
const fixtures = require('../fixtures');

describe('Topology', function() {
    it('can start, process, and stop', done => {
        fixtures.topology.start(err => {
            assert(!err);

            fixtures.topology.start(err => {
                assert(!err);

                fixtures.outputConnection.dequeue((err, message) => {
                    assert(!err);
                    assert(message);
                    assert(message.number, 2);

                    fixtures.topology.stop(err => {
                        assert(!err);

                        fixtures.topology.stop(err => {
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
