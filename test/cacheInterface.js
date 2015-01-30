(function (should, lib, util) {
    describe('Cache Interface', function () {
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
        it('Should receive error when accessing the un-implemented \'keys\' method', function () {
            (function() {
                var farceCache = new FarceCache();
                farceCache.keys();
            }).should.throw('function keys not implemented');
        });
        it('Should receive error when accessing the un-implemented \'set\' method', function () {
            (function() {
                var farceCache = new FarceCache();
                farceCache.set();
            }).should.throw('function set not implemented');
        });
    });

    function FarceCache() {}
    util.inherits(FarceCache, lib.cacheInterface);

}(require('should'), require('../index'), require('util')));