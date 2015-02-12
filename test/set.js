(function (expect, Q, lib) {
    'use strict';
    var redisClient,
        s3fsImpl,
        s3Credentials,
        bucketName,
        cachesToTest = [
            {
                name: 'Memory Set',
                createCache: function () {
                    return Q.when(lib.cache('mem', {}));
                }
            },
            {
                name: 'Redis Set',
                before: function (done) {
                    redisClient = require('redis').createClient();
                    redisClient.on('connect', done);
                    redisClient.on('error', done);
                },
                beforeEach: function (done) {
                    /* jshint camelcase: false */
                    redisClient.send_command('flushall', [], done);
                    /* jshint camelcase: true */
                },
                createCache: function () {
                    return Q.when(lib.cache('redis',
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

                    s3fsImpl = require('s3fs')(s3Credentials, bucketName);

                    s3fsImpl.create().then(function () {
                        done();
                    }, done);
                },
                afterEach: function (done) {
                    s3fsImpl.destroy().then(done, done);
                },
                createCache: function () {
                    return Q.when(lib.cache('s3',
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
                beforeEach: function (done) {
                    bucketName = 'fs-cache-test-bucket-' + (Math.random() + '').slice(2, 8);
                    done();
                },
                afterEach: function (done) {
                    require('rmdir')(bucketName, function(err) {
                        done(err);
                    });
                },
                createCache: function () {
                    return Q.when(lib.cache('fs',
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
            it('Should be able to retrieve the same cache set', function () {
                return testConfig.createCache().then(function (cache) {
                    return cache.set('test').then(function (originalCache) {
                        return expect(cache.set('test')).to.eventually.equal(originalCache);
                    });
                });
            });
            it('Should be able to destroy a cache set', function () {
                return testConfig.createCache().then(function (cache) {
                    return expect(cache.set('test')).to.eventually.be.fulfilled;
                });
            });
            it('Shouldn\'t be able to create a set of a set', function () {
                return testConfig.createCache().then(function (cache) {
                    return cache.set('test').then(function (cacheSet) {
                        return expect(function () {
                            cacheSet.set('test');
                        }).to.throw(Error, 'Cannot call set of a set instance');
                    });
                });
            });
        });
    });
}(require('./chaiPromise').expect, require('q'), require('../index')));