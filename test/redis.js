(function (expect, util, lib, errors, redis) {
    'use strict';
    describe('Redis Cache Implementation', function () {
        var dataToSave = {
                name: 'Zul'
            },
            redisClient;

        before(function (done) {
            redisClient = redis.createClient();
            redisClient.on('connect', done);
            redisClient.on('error', done);
        });

        beforeEach(function (done) {
            /* jshint camelcase: false */
            redisClient.send_command('flushall', [], done);
            /* jshint camelcase: true */
        });

        it('Shouldn\'t be able to instantiate the Redis cache implementation without a host', function () {
            expect(function () {
                lib.cache('redis', {});
            }).to.throw(Error, 'Missing Required Argument [host]');
        });
        it('Shouldn\'t be able to instantiate the Redis cache implementation with an invalid host', function () {
            expect(function () {
                lib.cache('redis',
                    {
                        host: {}
                    }
                );
            }).to.throw(Error, 'Invalid Argument Type Expected [string] for [host] but got [object]');
        });
        it('Shouldn\'t be able to instantiate the Redis cache implementation without a port', function () {
            expect(function () {
                lib.cache('redis',
                    {
                        host: 'test'
                    }
                );
            }).to.throw(Error, 'Missing Required Argument [port]');
        });
        it('Shouldn\'t be able to instantiate the Redis cache implementation with an invalid port', function () {
            expect(function () {
                lib.cache('redis',
                    {
                        host: 'test',
                        port: {}
                    }
                );
            }).to.throw(Error, 'Invalid Argument Type Expected [number] for [port] but got [object]');
        });
        it('Shouldn\'t be able to instantiate the Redis cache implementation without options', function () {
            expect(function () {
                lib.cache('redis',
                    {
                        host: 'test',
                        port: 12345
                    }
                );
            }).to.throw(Error, 'Missing Required Argument [options]');
        });
        it('Shouldn\'t be able to instantiate the Redis cache implementation with invalid options', function () {
            expect(function () {
                lib.cache('redis',
                    {
                        host: 'test',
                        port: 12345,
                        options: 'asdf'
                    }
                );
            }).to.throw(Error, 'Invalid Argument Type Expected [object] for [options] but got [string]');
        });
        it('Should instantiate the Redis cache implementation', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            expect(cache).to.be.ok();
        });
        it('Redis cache implementation should inherit from the EventEmitter', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            expect(cache).to.be.an.instanceOf(require('events').EventEmitter);
        });
        it('Should be able to save a cached value', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            return expect(cache.save(JSON.stringify(dataToSave), 'save-test')).to.eventually.deep.equal({etag: '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0'});
        });
        it('Should be able to save a cached value with a hash that doesn\'t exist', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            return expect(cache.save(JSON.stringify(dataToSave), 'save-test-no-exist', '5bf48f033197ecd3635f459c145b0815')).to.eventually.deep.equal({etag: '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0'});
        });
        it('Should be able to update a cached value', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            return cache.save(JSON.stringify(dataToSave), 'update-test').then(function (data) {
                return expect(cache.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', data.etag)).to.eventually.deep.equal({etag: '8d8dbf068de76b07ecd87c58f228c8dfdce138dd'});
            });
        });
        it('Should be able to update a cached value that no longer exists', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            return expect(cache.save(JSON.stringify(dataToSave), 'does-not-exist')).to.eventually.deep.equal({etag: '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0'});
        });
        it('Shouldn\'t be able to update a cached value when you have the wrong hash', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            return cache.save(JSON.stringify(dataToSave), 'update-test').then(function (data) {
                return expect(cache.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', data.etag + '1')).to.eventually.be
                    .rejectedWith(errors.CacheError, util.format(errors.errorCodes.HASH_MISMATCH.message, data.etag + '1', data.etag));
            });
        });
        it('Should be able to restore a cached value', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            return cache.save(JSON.stringify(dataToSave), 'restore-test').then(function (data) {
                return expect(cache.restore('restore-test')).to.eventually.deep.equal({
                    body: JSON.stringify(dataToSave),
                    etag: data.etag
                });
            });
        });
        it('Shouldn\'t restore the same version', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            return cache.save(JSON.stringify(dataToSave), 'restore-test').then(function (data) {
                return expect(cache.restore('restore-test', data.etag)).to.eventually.deep.equal(data);
            });
        });
        it('Should restore if a different version exists', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            return cache.save(JSON.stringify(dataToSave), 'restore-test').then(function (data) {
                return expect(cache.restore('restore-test', 'test-hash')).to.eventually.deep.equal({
                    body: JSON.stringify(dataToSave),
                    etag: data.etag
                });
            });
        });
        it('Shouldn\'t restore if a value doesn\'t exist', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            return expect(cache.restore('doesnt-exist')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.CACHE_NOT_FOUND.message, 'doesnt-exist'));
        });
        it('Should be able to remove a cached value', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            return cache.save(JSON.stringify(dataToSave), 'delete-test').then(function () {
                return expect(cache.remove('delete-test')).to.eventually.be.fulfilled;
            });
        });
        it('Should be able to remove a cached value with a hash', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            return cache.save(JSON.stringify(dataToSave), 'delete-test').then(function (data) {
                return expect(cache.remove('delete-test', data.etag)).to.eventually.be.fulfilled;
            });
        });
        it('Shouldn\'t be able to remove a cached value with an incorrect hash', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            return cache.save(JSON.stringify(dataToSave), 'delete-test').then(function (data) {
                return expect(cache.remove('delete-test', 'incorrect-hash')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.HASH_MISMATCH.message, 'incorrect-hash', data.etag));
            });
        });
        it('Shouldn\'t be able to remove a cached value that doesn\'t exist', function () {
            var cache = lib.cache('redis',
                {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }
            );
            return expect(cache.remove('delete-test-no-exist')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.CACHE_NOT_FOUND.message, 'delete-test-no-exist'));
        });
    });
}(require('./helper').getExpect(), require('util'), require('../index'), require('../lib/errors'), require('redis')));