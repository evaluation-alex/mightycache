'use strict';
/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014-2016 Riptide Software Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(function (expect, util, Promise, lib, errors) {
    describe('Implementation Tests', function () {
        var redisClient,
            s3fsImpl,
            s3Credentials,
            bucketName,
            originalAccessKeyId,
            originalSecretAccessKey,
            cachesToTest = [
                {
                    name: 'Memory',
                    createCache: function () {
                        return Promise.resolve(lib.cache('mem', {}));
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
                    name: 'Memory Set',
                    createCache: function () {
                        return lib.cache('mem', {}).set('test');
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
                    before: function () {
                        return new Promise(function (resolve, reject) {
                            redisClient = require('redis').createClient();
                            redisClient.on('connect', resolve);
                            redisClient.on('error', reject);
                        });
                    },
                    beforeEach: function () {
                        return new Promise(function (resolve) {
                            /* jshint camelcase: false */
                            redisClient.send_command('flushall', [], resolve);
                            /* jshint camelcase: true */
                        });
                    },
                    createCache: function () {
                        return Promise.resolve(lib.cache('redis',
                            {
                                host: 'localhost',
                                port: 6379,
                                options: {}
                            }
                        ));
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
                    name: 'Redis Set',
                    before: function () {
                        return new Promise(function (resolve, reject) {
                            redisClient = require('redis').createClient();
                            redisClient.on('connect', resolve);
                            redisClient.on('error', reject);
                        });
                    },
                    beforeEach: function () {
                        return new Promise(function (resolve) {
                            /* jshint camelcase: false */
                            redisClient.send_command('flushall', [], resolve);
                            /* jshint camelcase: true */
                        });
                    },
                    createCache: function () {
                        return lib.cache('redis',
                            {
                                host: 'localhost',
                                port: 6379,
                                options: {}
                            }
                        ).set('test');
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
                    name: 'File System',
                    beforeEach: function () {
                        bucketName = 'fs-cache-test-bucket-' + (Math.random() + '').slice(2, 8);
                    },
                    afterEach: function () {
                        return require('fs-wishlist').mixin(require('fs')).rmdirp(bucketName);
                    },
                    createCache: function () {
                        return Promise.resolve(lib.cache('fs',
                            {
                                path: bucketName,
                                fs: require('fs')
                            }
                        ));
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
                    name: 'File System Set',
                    beforeEach: function () {
                        bucketName = 'fs-cache-test-bucket-' + (Math.random() + '').slice(2, 8);
                    },
                    afterEach: function () {
                        return require('fs-wishlist').mixin(require('fs')).rmdirp(bucketName);
                    },
                    createCache: function () {
                        return lib.cache('fs',
                            {
                                path: bucketName,
                                fs: require('fs')
                            }
                        ).set('test');
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
                    before: function () {
                        bucketName = 'mightycache-s3-test-bucket-' + (Math.random() + '').slice(2, 8);

                        s3fsImpl = require('s3fs')(bucketName);

                        return s3fsImpl.create();
                    },
                    after: function () {
                        return s3fsImpl.destroy();
                    },
                    createCache: function () {
                        return Promise.resolve(lib.cache('s3',
                            {
                                bucket: bucketName
                            }
                        ));
                    },
                    dataToSave: {
                        name: 'Zul'
                    },
                    dataToSaveHash: '5bf48f033197ecd3635f459c145b0815',
                    dataToUpdate: {
                        name: 'Odoyle Rules!'
                    },
                    dataToUpdateHash: 'd9b4bc4b39054b07b6f2512abcdad03f'
                },
                {
                    name: 'S3 Set',
                    before: function () {
                        bucketName = 'mightycache-s3-set-test-bucket-' + (Math.random() + '').slice(2, 8);

                        s3fsImpl = require('s3fs')(bucketName);

                        return s3fsImpl.create();
                    },
                    after: function () {
                        return s3fsImpl.destroy();
                    },
                    createCache: function () {
                        return lib.cache('s3',
                            {
                                bucket: bucketName
                            }
                        ).set('test');
                    },
                    dataToSave: {
                        name: 'Zul'
                    },
                    dataToSaveHash: '5bf48f033197ecd3635f459c145b0815',
                    dataToUpdate: {
                        name: 'Odoyle Rules!'
                    },
                    dataToUpdateHash: 'd9b4bc4b39054b07b6f2512abcdad03f'
                },
                {
                    name: 'S3 Hardcoded Credentials',
                    before: function () {
                        originalAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
                        process.env.AWS_ACCESS_KEY_ID = '';
                        originalSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
                        process.env.AWS_SECRET_ACCESS_KEY = '';
                        s3Credentials = {
                            accessKeyId: originalAccessKeyId,
                            secretAccessKey: originalSecretAccessKey,
                            region: process.env.AWS_REGION
                        };
                        bucketName = 'mightycache-s3-test-bucket-' + (Math.random() + '').slice(2, 8);

                        delete require.cache['aws-sdk'];
                        s3fsImpl = require('s3fs')(bucketName, s3Credentials);

                        return s3fsImpl.create();
                    },
                    after: function () {
                        process.env.AWS_ACCESS_KEY_ID = originalAccessKeyId;
                        process.env.AWS_SECRET_ACCESS_KEY = originalSecretAccessKey;
                        return s3fsImpl.destroy();
                    },
                    createCache: function () {
                        return Promise.resolve(lib.cache('s3',
                            {
                                bucket: bucketName,
                                accessKeyId: s3Credentials.accessKeyId,
                                secretAccessKey: s3Credentials.secretAccessKey
                            }
                        ));
                    },
                    dataToSave: {
                        name: 'Zul'
                    },
                    dataToSaveHash: '5bf48f033197ecd3635f459c145b0815',
                    dataToUpdate: {
                        name: 'Odoyle Rules!'
                    },
                    dataToUpdateHash: 'd9b4bc4b39054b07b6f2512abcdad03f'
                },
                {
                    name: 'S3 Set Hardcoded Credentials',
                    before: function () {
                        originalAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
                        process.env.AWS_ACCESS_KEY_ID = '';
                        originalSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
                        process.env.AWS_SECRET_ACCESS_KEY = '';
                        s3Credentials = {
                            accessKeyId: originalAccessKeyId,
                            secretAccessKey: originalSecretAccessKey,
                            region: process.env.AWS_REGION
                        };
                        bucketName = 'mightycache-s3-set-test-bucket-' + (Math.random() + '').slice(2, 8);

                        delete require.cache['aws-sdk'];
                        s3fsImpl = require('s3fs')(bucketName, s3Credentials);

                        return s3fsImpl.create();
                    },
                    after: function () {
                        process.env.AWS_ACCESS_KEY_ID = originalAccessKeyId;
                        process.env.AWS_SECRET_ACCESS_KEY = originalSecretAccessKey;
                        return s3fsImpl.destroy();
                    },
                    createCache: function () {
                        return lib.cache('s3',
                            {
                                bucket: bucketName,
                                accessKeyId: s3Credentials.accessKeyId,
                                secretAccessKey: s3Credentials.secretAccessKey
                            }
                        ).set('test');
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
                before(function () {
                    if (testConfig.before) {
                        return testConfig.before();
                    }
                });
                beforeEach(function () {
                    if (testConfig.beforeEach) {
                        return testConfig.beforeEach();
                    }
                });
                after(function () {
                    if (testConfig.after) {
                        return testConfig.after();
                    }
                });
                afterEach(function () {
                    if (testConfig.afterEach) {
                        return testConfig.afterEach();
                    }
                });
                it('Should instantiate the test cache implementation', function () {
                    return testConfig.createCache().then(function (cache) {
                        expect(cache).to.be.ok();
                    });
                });
                it('Should be able to save a cached value', function () {
                    return testConfig.createCache().then(function (cache) {
                        return expect(cache.save(JSON.stringify(testConfig.dataToSave), 'save-test')).to.eventually.deep.equal({etag: testConfig.dataToSaveHash});
                    });
                });
                it('Should be able to save a cached value with a hash that doesn\'t exist', function () {
                    return testConfig.createCache().then(function (cache) {
                        return expect(cache.save(JSON.stringify(testConfig.dataToSave), 'save-test-no-exist', 'some-hash')).to.eventually.deep.equal({etag: testConfig.dataToSaveHash});
                    });
                });
                it('Should be able to update a cached value', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.save(JSON.stringify(testConfig.dataToSave), 'update-test').then(function (data) {
                            return expect(cache.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', data.etag)).to.eventually.deep.equal({etag: testConfig.dataToUpdateHash});
                        });
                    });
                });
                it('Should be able to update a cached value that no longer exists', function () {
                    return testConfig.createCache().then(function (cache) {
                        return expect(cache.save(JSON.stringify(testConfig.dataToSave), 'does-not-exist')).to.eventually.deep.equal({etag: testConfig.dataToSaveHash});
                    });
                });
                it('Shouldn\'t be able to update a cached value when you have the wrong hash', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.save(JSON.stringify(testConfig.dataToSave), 'update-test').then(function (data) {
                            return expect(cache.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', data.etag + '1')).to.eventually.be
                                .rejectedWith(errors.CacheError, util.format(errors.errorCodes.HASH_MISMATCH.message, data.etag + '1', data.etag));
                        });
                    });
                });
                it('Should be able to restore a cached value', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.save(JSON.stringify(testConfig.dataToSave), 'restore-test').then(function (data) {
                            return expect(cache.restore('restore-test')).to.eventually.deep.equal({
                                body: JSON.stringify(testConfig.dataToSave),
                                etag: data.etag
                            });
                        });
                    });
                });
                it('Shouldn\'t restore the same version', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.save(JSON.stringify(testConfig.dataToSave), 'restore-test').then(function (data) {
                            return expect(cache.restore('restore-test', data.etag)).to.eventually.deep.equal(data);
                        });
                    });
                });
                it('Should restore if a different version exists', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.save(JSON.stringify(testConfig.dataToSave), 'restore-test').then(function (data) {
                            return expect(cache.restore('restore-test', 'test-hash')).to.eventually.deep.equal({
                                body: JSON.stringify(testConfig.dataToSave),
                                etag: data.etag
                            });
                        });
                    });
                });
                it('Shouldn\'t restore if a value doesn\'t exist', function () {
                    return testConfig.createCache().then(function (cache) {
                        return expect(cache.restore('doesnt-exist')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.CACHE_NOT_FOUND.message, 'doesnt-exist'));
                    });
                });
                it('Should be able to remove a cached value', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.save(JSON.stringify(testConfig.dataToSave), 'delete-test').then(function () {
                            return expect(cache.remove('delete-test')).to.eventually.be.fulfilled();
                        });
                    });
                });
                it('Should be able to remove a cached value with a hash', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.save(JSON.stringify(testConfig.dataToSave), 'delete-test').then(function (data) {
                            return expect(cache.remove('delete-test', data.etag)).to.eventually.be.fulfilled();
                        });
                    });
                });
                it('Shouldn\'t be able to remove a cached value with an incorrect hash', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.save(JSON.stringify(testConfig.dataToSave), 'delete-test').then(function (data) {
                            return expect(cache.remove('delete-test', 'incorrect-hash')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.HASH_MISMATCH.message, 'incorrect-hash', data.etag));
                        });
                    });
                });
                it('Shouldn\'t be able to remove a cached value that doesn\'t exist', function () {
                    return testConfig.createCache().then(function (cache) {
                        return expect(cache.remove('delete-test-no-exist')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.CACHE_NOT_FOUND.message, 'delete-test-no-exist'));
                    });
                });
                it('Should be able to save, restore, and delete a cached value with weird characters', function () {
                    // See http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#object-keys for where these characters came from
                    return testConfig.createCache().then(function (cache) {
                        var key = '*$@=;:+    ,?\\{^}%`]\'\'>[~<#|';
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
                it('Should be able to list all keys', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.save('', 'keyList1').then(function () {
                            return cache.save('', 'keyList2');
                        }).then(function () {
                            return expect(cache.keys()).to.eventually.include('keyList1').and.to.include('keyList2');
                        });
                    });
                });
                it('Should be able to tell when a key doesn\'t exist', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.exists('existsNegativeTest').then(function (exists) {
                            expect(exists).to.equal(false);
                        });
                    });
                });
                it('Should return true if a key exists', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.save('', 'existsTest').then(function () {
                            return cache.exists('existsTest').then(function (exists) {
                                expect(exists).to.equal(true);
                            });
                        });
                    });
                });
                it('Should be able to head a cached value', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.save(JSON.stringify(testConfig.dataToSave), 'head-test').then(function (data) {
                            return expect(cache.head('head-test')).to.eventually.deep.equal({
                                etag: data.etag
                            });
                        });
                    });
                });
                it('Shouldn\'t head an object if a value doesn\'t exist', function () {
                    return testConfig.createCache().then(function (cache) {
                        return expect(cache.head('doesnt-exist')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.CACHE_NOT_FOUND.message, 'doesnt-exist'));
                    });
                });
                it('Should be able to clear all cached values', function () {
                    return testConfig.createCache()
                        .then(function (cache) {
                            return Promise.all([
                                cache.save(JSON.stringify(testConfig.dataToSave), 'value1'),
                                cache.save(JSON.stringify(testConfig.dataToSave), 'value2')
                            ])
                            .then(function () {
                                return cache.clear();
                            })
                            .then(function () {
                                return expect(cache.keys()).to.eventually.have.lengthOf(0);
                            });
                        });
                });
            });
        });
    });
}(require('./chaiPromise').expect, require('util'), require('bluebird'), require('../index'), require('../lib/errors')));