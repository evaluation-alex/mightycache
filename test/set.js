(function (expect, Promise, lib) {
    'use strict';
    describe('Set Specific Tests', function () {
        var redisClient,
            s3fsImpl,
            s3Credentials,
            bucketName,
            cachesToTest = [
                {
                    name: 'Memory Set',
                    createCache: function () {
                        return Promise.resolve(lib.cache('mem', {}));
                    }
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
                        return Promise.resolve(lib.cache('redis',
                            {
                                host: 'localhost',
                                port: 6379,
                                options: {}
                            }
                        ));
                    }
                },
                {
                    name: 'S3 Set',
                    before: function () {
                        s3Credentials = {
                            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                            secretAccessKey: process.env.AWS_SECRET_KEY,
                            region: process.env.AWS_REGION
                        };
                        bucketName = 'mightycache-s3-setImpl-test-bucket-' + (Math.random() + '').slice(2, 8);

                        s3fsImpl = require('s3fs')(bucketName, s3Credentials);

                        return s3fsImpl.create();
                    },
                    after: function () {
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
                    }
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
                        return Promise.resolve(lib.cache('fs',
                            {
                                path: bucketName,
                                fs: require('fs')
                            }
                        ));
                    }
                }
            ];

        cachesToTest.forEach(function (testConfig) {
            describe(testConfig.name + ' Specific Implementation', function () {
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
                it('Should be able to retrieve the same cache set', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.set('cacheSetRestore').then(function (originalCache) {
                            return expect(cache.set('cacheSetRestore')).to.eventually.equal(originalCache);
                        });
                    });
                });
                it('Should be able to destroy a cache set', function () {
                    return testConfig.createCache().then(function (cache) {
                        return expect(cache.set('cacheSetDestroy')).to.eventually.be.fulfilled();
                    });
                });
                it('Shouldn\'t be able to create a set of a set', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.set('cacheSetSet').then(function (cacheSet) {
                            return expect(function () {
                                cacheSet.set('cacheSetSet');
                            }).to.throw(Error, 'Cannot call set of a set instance');
                        });
                    });
                });
            });
        });
    });
}(require('./chaiPromise').expect, require('bluebird'), require('../index')));