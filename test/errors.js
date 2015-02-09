(function (expect, errors) {
    'use strict';
    describe('Errors Implementation', function () {
        it('Should be able to instantiate an error without the \'new\' keyword', function () {
            var err = errors.errorCodes.HASH_MISMATCH,
                errObj = errors.CacheError(err.name, err.message, err.code);

            expect(errObj).to.be.an.instanceof(errors.CacheError);
        });
        it('Should be able to instantiate an error with the \'new\' keyword', function () {
            var err = errors.errorCodes.HASH_MISMATCH,
                errObj = new errors.CacheError(err.name, err.message, err.code);

            expect(errObj).to.be.an.instanceof(errors.CacheError);
        });
    });
}(require('./chaiPromise').expect, require('../lib/errors')));