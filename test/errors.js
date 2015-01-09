(function (should, errors) {
    describe('Errors Implementation', function () {
        it('Should be able to instantiate an error without the \'new\' keyword', function () {
            var err = errors.errorCodes.HASH_MISMATCH,
                errObj = errors.CacheError(err.name, err.message, err.code);

            errObj.constructor.name.should.be.exactly('CacheError');
        });
        it('Should be able to instantiate an error with the \'new\' keyword', function () {
            var err = errors.errorCodes.HASH_MISMATCH,
                errObj = new errors.CacheError(err.name, err.message, err.code);

            errObj.constructor.name.should.be.exactly('CacheError');
        });
    });
}(require('should'), require('../lib/errors')));