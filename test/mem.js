(function (expect, lib) {
    'use strict';
    describe('Memory Cache Implementation', function () {
        it('Should instantiate the test cache implementation', function () {
            expect(lib.cache('mem', {})).to.be.ok();
        });
    });
}(require('./chaiPromise').expect, require('../index')));