(function (should, lib, util) {
    describe('Cache Interface', function () {
        it('Should receive error when not using an impl name', function () {
            (function() {
                lib.cache();
            }).should.throw('Impl is required and must be a string');
        });
        it('Should receive error when using an invalid impl name type', function () {
            (function() {
                lib.cache({});
            }).should.throw('Impl is required and must be a string');
        });
        it('Should receive error when not using options', function () {
            (function() {
                lib.cache('test');
            }).should.throw('Options is required and must be an object');
        });
        it('Should receive error when using an invalid options type', function () {
            (function() {
                lib.cache('Egon', 'Spengler');
            }).should.throw('Options is required and must be an object');
        });
        it('Should receive error when trying to use an impl that doesn\'t exist', function () {
            (function() {
                lib.cache('does-not-exist', {});
            }).should.throw('Implementation [does-not-exist] does not exist');
        });
        it('Should receive error when accessing the un-implemented \'save\' method', function () {
            (function() {
                var farceCache = new FarceCache();
                farceCache.save();
            }).should.throw('function save not implemented');
        });
        it('Should receive error when accessing the un-implemented \'restore\' method', function () {
            (function() {
                var farceCache = new FarceCache();
                farceCache.restore();
            }).should.throw('function restore not implemented');
        });
        it('Should receive error when accessing the un-implemented \'remove\' method', function () {
            (function() {
                var farceCache = new FarceCache();
                farceCache.remove();
            }).should.throw('function remove not implemented');
        });
    });

    function FarceCache() {}
    util.inherits(FarceCache, lib.cacheInterface);

}(require('should'), require('../index'), require('util')));