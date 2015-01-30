(function (expect, util, lib, errors) {
    'use strict';
    var redisClient,
        s3fsImpl,
        s3Credentials,
        bucketName,
        cachesToTest = [
            {
                name: 'Memory',
                createCache: function () {
                    return lib.cache('mem', {});
                },
                dataToSave: {
                    name: 'Zul'
                },
                dataToSaveHash: '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0',
                dataToUpdate: {
                    name: 'Odoyle Rules!'
                },
                dataToUpdateHash: '8d8dbf068de76b07ecd87c58f228c8dfdce138dd'
            },
            {
                name: 'Redis',
                before: function (done) {
                    redisClient = require('redis').createClient();
                    redisClient.on('connect', done);
                    redisClient.on('error', done);
                },
                beforeEach: function (done) {
                    redisClient.send_command('flushall', [], done);
                },
                createCache: function () {
                    return lib.cache('redis',
                        {
                            host: 'localhost',
                            port: 6379,
                            options: {}
                        }
                    );
                },
                dataToSave: {
                    name: 'Zul'
                },
                dataToSaveHash: '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0',
                dataToUpdate: {
                    name: 'Odoyle Rules!'
                },
                dataToUpdateHash: '8d8dbf068de76b07ecd87c58f228c8dfdce138dd'
            },
            {
                name: 'S3',
                before: function (done) {
                    redisClient = require('redis').createClient();
                    redisClient.on('connect', done);
                    redisClient.on('error', done);
                },
                beforeEach: function (done) {
                    s3Credentials = {
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_KEY,
                        region: process.env.AWS_REGION
                    };
                    bucketName = 's3fs-cache-test-bucket-' + (Math.random() + '').slice(2, 8);

                    s3fsImpl = new require('s3fs')(s3Credentials, bucketName);

                    s3fsImpl.create().then(function () {
                        done();
                    }, done);
                },
                afterEach: function (done) {
                    s3fsImpl.destroy().then(done, done);
                },
                createCache: function () {
                    return lib.cache('s3',
                        {
                            bucket: bucketName,
                            accessKeyId: s3Credentials.accessKeyId,
                            secretAccessKey: s3Credentials.secretAccessKey
                        }
                    );
                },
                dataToSave: {
                    name: 'Zul'
                },
                dataToSaveHash: '5bf48f033197ecd3635f459c145b0815',
                dataToUpdate: {
                    name: 'Odoyle Rules!'
                },
                dataToUpdateHash: 'd9b4bc4b39054b07b6f2512abcdad03f'
            }
        ];

    cachesToTest.forEach(function (testConfig) {
        describe(testConfig.name + ' Implementation', function () {
            before(function (done) {
                if (testConfig.before) {
                    testConfig.before(done);
                } else {
                    done();
                }
            });
            beforeEach(function (done) {
                if (testConfig.beforeEach) {
                    testConfig.beforeEach(done);
                } else {
                    done();
                }
            });
            after(function (done) {
                if (testConfig.after) {
                    testConfig.after(done);
                } else {
                    done();
                }
            });
            afterEach(function (done) {
                if (testConfig.afterEach) {
                    testConfig.afterEach(done);
                } else {
                    done();
                }
            });
            it('Should instantiate the test cache implementation', function () {
                var cache = testConfig.createCache();
                expect(cache).to.be.ok();
            });
            it('Should be able to save a cached value', function () {
                var cache = testConfig.createCache();
                return expect(cache.save(JSON.stringify(testConfig.dataToSave), 'save-test')).to.eventually.deep.equal({etag: testConfig.dataToSaveHash});
            });
            it('Should be able to save a cached value with a hash that doesn\'t exist', function () {
                var cache = testConfig.createCache();
                return expect(cache.save(JSON.stringify(testConfig.dataToSave), 'save-test-no-exist', 'some-hash')).to.eventually.deep.equal({etag: testConfig.dataToSaveHash});
            });
            it('Should be able to update a cached value', function () {
                var cache = testConfig.createCache();
                return cache.save(JSON.stringify(testConfig.dataToSave), 'update-test').then(function (data) {
                    return expect(cache.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', data.etag)).to.eventually.deep.equal({etag: testConfig.dataToUpdateHash});
                });
            });
            it('Should be able to update a cached value that no longer exists', function () {
                var cache = testConfig.createCache();
                return expect(cache.save(JSON.stringify(testConfig.dataToSave), 'does-not-exist')).to.eventually.deep.equal({etag: testConfig.dataToSaveHash});
            });
            it('Shouldn\'t be able to update a cached value when you have the wrong hash', function () {
                var cache = testConfig.createCache();
                return cache.save(JSON.stringify(testConfig.dataToSave), 'update-test').then(function (data) {
                    return expect(cache.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', data.etag + '1')).to.eventually.be
                        .rejectedWith(errors.CacheError, util.format(errors.errorCodes.HASH_MISMATCH.message, data.etag + '1', data.etag));
                });
            });
            it('Should be able to restore a cached value', function () {
                var cache = testConfig.createCache();
                return cache.save(JSON.stringify(testConfig.dataToSave), 'restore-test').then(function (data) {
                    return expect(cache.restore('restore-test')).to.eventually.deep.equal({
                        body: JSON.stringify(testConfig.dataToSave),
                        etag: data.etag
                    });
                });
            });
            it('Shouldn\'t restore the same version', function () {
                var cache = testConfig.createCache();
                return cache.save(JSON.stringify(testConfig.dataToSave), 'restore-test').then(function (data) {
                    return expect(cache.restore('restore-test', data.etag)).to.eventually.deep.equal(data);
                });
            });
            it('Should restore if a different version exists', function () {
                var cache = testConfig.createCache();
                return cache.save(JSON.stringify(testConfig.dataToSave), 'restore-test').then(function (data) {
                    return expect(cache.restore('restore-test', 'test-hash')).to.eventually.deep.equal({
                        body: JSON.stringify(testConfig.dataToSave),
                        etag: data.etag
                    });
                });
            });
            it('Shouldn\'t restore if a value doesn\'t exist', function () {
                var cache = testConfig.createCache();
                return expect(cache.restore('doesnt-exist')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.CACHE_NOT_FOUND.message, 'doesnt-exist'));
            });
            it('Should be able to remove a cached value', function () {
                var cache = testConfig.createCache();
                return cache.save(JSON.stringify(testConfig.dataToSave), 'delete-test').then(function () {
                    return expect(cache.remove('delete-test')).to.eventually.be.fulfilled;
                });
            });
            it('Should be able to remove a cached value with a hash', function () {
                var cache = testConfig.createCache();
                return cache.save(JSON.stringify(testConfig.dataToSave), 'delete-test').then(function (data) {
                    return expect(cache.remove('delete-test', data.etag)).to.eventually.be.fulfilled;
                });
            });
            it('Shouldn\'t be able to remove a cached value with an incorrect hash', function () {
                var cache = testConfig.createCache();
                return cache.save(JSON.stringify(testConfig.dataToSave), 'delete-test').then(function (data) {
                    return expect(cache.remove('delete-test', 'incorrect-hash')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.HASH_MISMATCH.message, 'incorrect-hash', data.etag));
                });
            });
            it('Shouldn\'t be able to remove a cached value that doesn\'t exist', function () {
                var cache = testConfig.createCache();
                return expect(cache.remove('delete-test-no-exist')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.CACHE_NOT_FOUND.message, 'delete-test-no-exist'));
            });
            it('Should be able to save, restore, and delete a cached value with weird characters', function () {
                // See http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#object-keys for where these characters came from
                var cache = testConfig.createCache(),
                    key = '*$@=;:+    ,?\\{^}%`]\'\'>[~<#|';
                return cache.save(JSON.stringify(testConfig.dataToSave), key).then(function () {
                    return cache.restore(key).then(function (data) {
                        expect(data.body).to.equal(JSON.stringify(testConfig.dataToSave));
                        return cache.remove(key).then(function () {
                            return expect(cache.restore(key)).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.CACHE_NOT_FOUND.message, key));
                        });
                    });
                });
            });
        });
    });
}(require('./helper').getExpect(), require('util'), require('../index'), require('../lib/errors')));