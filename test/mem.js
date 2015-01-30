(function (expect, lib) {
    'use strict';
    describe('Memory Implementation Specific Tests', function () {
        it('Should instantiate the test cache implementation', function () {
            var cache = lib.cache('mem', {});
            expect(cache).to.be.ok();
        });
    });
}(require('./helper').getExpect(), require('../index')));