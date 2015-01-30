(function (expect, util, lib, errors) {
    'use strict';
    describe('Memory Cache Implementation', function () {
        var dataToSave = {
            name: 'Zul'
        };

        it('Should instantiate the test cache implementation', function () {
            var cache = lib.cache('mem', {});
            expect(cache).to.be.ok();
        });
        it('Should be able to save a cached value', function () {
            var cache = lib.cache('mem', {});
            return expect(cache.save(JSON.stringify(dataToSave), 'save-test')).to.eventually.deep.equal({etag: '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0'});
        });
        it('Should be able to save a cached value with a hash that doesn\'t exist', function () {
            var cache = lib.cache('mem', {});
            return expect(cache.save(JSON.stringify(dataToSave), 'save-test-no-exist', '5bf48f033197ecd3635f459c145b0815')).to.eventually.deep.equal({etag: '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0'});
        });
        it('Should be able to update a cached value', function () {
            var cache = lib.cache('mem', {});
            return cache.save(JSON.stringify(dataToSave), 'update-test').then(function (data) {
                return expect(cache.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', data.etag)).to.eventually.deep.equal({etag: '8d8dbf068de76b07ecd87c58f228c8dfdce138dd'});
            });
        });
        it('Should be able to update a cached value that no longer exists', function () {
            var cache = lib.cache('mem', {});
            return expect(cache.save(JSON.stringify(dataToSave), 'does-not-exist')).to.eventually.deep.equal({etag: '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0'});
        });
        it('Shouldn\'t be able to update a cached value when you have the wrong hash', function () {
            var cache = lib.cache('mem', {});
            return cache.save(JSON.stringify(dataToSave), 'update-test').then(function (data) {
                return expect(cache.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', data.etag + '1')).to.eventually.be
                    .rejectedWith(errors.CacheError, util.format(errors.errorCodes.HASH_MISMATCH.message, data.etag + '1', data.etag));
            });
        });
        it('Should be able to restore a cached value', function () {
            var cache = lib.cache('mem', {});
            return cache.save(JSON.stringify(dataToSave), 'restore-test').then(function (data) {
                return expect(cache.restore('restore-test')).to.eventually.deep.equal({
                    body: JSON.stringify(dataToSave),
                    etag: data.etag
                });
            });
        });
        it('Shouldn\'t restore the same version', function () {
            var cache = lib.cache('mem', {});
            return cache.save(JSON.stringify(dataToSave), 'restore-test').then(function (data) {
                return expect(cache.restore('restore-test', data.etag)).to.eventually.deep.equal(data);
            });
        });
        it('Should restore if a different version exists', function () {
            var cache = lib.cache('mem', {});
            return cache.save(JSON.stringify(dataToSave), 'restore-test').then(function (data) {
                return expect(cache.restore('restore-test', 'test-hash')).to.eventually.deep.equal({
                    body: JSON.stringify(dataToSave),
                    etag: data.etag
                });
            });
        });
        it('Shouldn\'t restore if a value doesn\'t exist', function () {
            var cache = lib.cache('mem', {});
            return expect(cache.restore('doesnt-exist')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.CACHE_NOT_FOUND.message, 'doesnt-exist'));
        });
        it('Should be able to remove a cached value', function () {
            var cache = lib.cache('mem', {});
            return cache.save(JSON.stringify(dataToSave), 'delete-test').then(function () {
                return expect(cache.remove('delete-test')).to.eventually.be.fulfilled;
            });
        });
        it('Should be able to remove a cached value with a hash', function () {
            var cache = lib.cache('mem', {});
            return cache.save(JSON.stringify(dataToSave), 'delete-test').then(function (data) {
                return expect(cache.remove('delete-test', data.etag)).to.eventually.be.fulfilled;
            });
        });
        it('Shouldn\'t be able to remove a cached value with an incorrect hash', function () {
            var cache = lib.cache('mem', {});
            return cache.save(JSON.stringify(dataToSave), 'delete-test').then(function (data) {
                return expect(cache.remove('delete-test', 'incorrect-hash')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.HASH_MISMATCH.message, 'incorrect-hash', data.etag));
            });
        });
        it('Shouldn\'t be able to remove a cached value that doesn\'t exist', function () {
            var cache = lib.cache('mem', {});
            return expect(cache.remove('delete-test-no-exist')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.CACHE_NOT_FOUND.message, 'delete-test-no-exist'));
        });
    });
}(require('./helper').getExpect(), require('util'), require('../index'), require('../lib/errors')));