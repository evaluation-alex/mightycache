'use strict';
/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Riptide Software Inc.
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
(function (expect, Promise, lib) {
    describe('Set Specific Tests', function () {
        var redisClient,
            s3fsImpl,
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
                        bucketName = 'mightycache-s3-setImpl-test-bucket-' + (Math.random() + '').slice(2, 8);

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
                            }));
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
                it('Should be able to list keys for an empty set', function () {
                    return testConfig.createCache().then(function (cache) {
                        return cache.set('cacheSetRestore').then(function (keySet) {
                            return keySet.keys();
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