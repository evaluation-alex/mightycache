(function (expect, lib, util) {
    describe('Cache Interface', function () {
        it('Should receive error when not using an impl name', function () {
            expect(function () {
                lib.cache();
            }).to.throw('Impl is required and must be a string');
        });
        it('Should receive error when using an invalid impl name type', function () {
            expect(function () {
                lib.cache({});
            }).to.throw('Impl is required and must be a string');
        });
        it('Should receive error when not using options', function () {
            expect(function () {
                lib.cache('test');
            }).to.throw('Options is required and must be an object');
        });
        it('Should receive error when using an invalid options type', function () {
            expect(function () {
                lib.cache('Egon', 'Spengler');
            }).to.throw('Options is required and must be an object');
        });
        it('Should receive error when trying to use an impl that doesn\'t exist', function () {
            expect(function () {
                lib.cache('does-not-exist', {});
            }).to.throw('Implementation [does-not-exist] does not exist');
        });
        it('Should receive error when accessing the un-implemented \'save\' method', function () {
            expect(function () {
                var farceCache = new FarceCache();
                farceCache.save();
            }).to.throw('function save not implemented');
        });
        it('Should receive error when accessing the un-implemented \'restore\' method', function () {
            expect(function () {
                var farceCache = new FarceCache();
                farceCache.restore();
            }).to.throw('function restore not implemented');
        });
        it('Should receive error when accessing the un-implemented \'remove\' method', function () {
            expect(function () {
                var farceCache = new FarceCache();
                farceCache.remove();
            }).to.throw('function remove not implemented');
        });
    });

    function FarceCache() {}
    util.inherits(FarceCache, lib.cacheInterface);

}(require('./chaiPromise').expect ,require('../index'), require('util')));