const assert = require('assert');
const fixtures = require('../fixtures');
const { Node } = require('../../core');

describe('Node', function() {
    it('can start and process', function(done) {
        fixtures.incrementNode.start(err => {
            assert(!err);

            fixtures.outputConnection.dequeue((err, message) => {
                assert(!err);
                assert(message);
                assert(message.number, 2);

                done();
            });

            fixtures.inputConnection.enqueue([{
                number: 1
            }], err => {
                assert(!err);
            });
        });
    });
});
