(function (expect, lib, util) {
    describe('Set Interface', function () {
        it('Should receive error when accessing the un-implemented \'save\' method', function () {
            expect(function() {
                var farceCache = new FarceCache();
                farceCache.save();
            }).to.throw('function save not implemented');
        });
        it('Should receive error when accessing the un-implemented \'restore\' method', function () {
            expect(function() {
                var farceCache = new FarceCache();
                farceCache.restore();
            }).to.throw('function restore not implemented');
        });
        it('Should receive error when accessing the un-implemented \'remove\' method', function () {
            expect(function() {
                var farceCache = new FarceCache();
                farceCache.remove();
            }).to.throw('function remove not implemented');
        });
        it('Should receive error when accessing the un-implemented \'keys\' method', function () {
            expect(function() {
                var farceCache = new FarceCache();
                farceCache.keys();
            }).to.throw('function keys not implemented');
        });
    });

    function FarceCache() {}
    util.inherits(FarceCache, lib.setInterface);

}(require('./chaiPromise').expect, require('../index'), require('util')));