(function (should, util, lib, errors, S3FS) {
    'use strict';
    var s3Credentials,
        bucketName,
        s3fsImpl;

    describe('S3 Cache Implementation', function () {
        beforeEach(function (done) {
            s3Credentials = {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_KEY,
                region: process.env.AWS_REGION
            };
            bucketName = 's3fs-cache-test-bucket-' + (Math.random() + '').slice(2, 8);
            s3fsImpl = new S3FS(s3Credentials, bucketName);

            s3fsImpl.create().then(function () {
                done();
            }, done);
        });

        afterEach(function (done) {
            s3fsImpl.destroy().then(function () {
                done();
            }, function (reason) {
                if (reason.code === 'NoSuchBucket') {
                    // If the bucket doesn't exist during cleanup we don't need to consider it an issue
                    done();
                } else {
                    done(reason);
                }
            });
        });

        it('Shouldn\'t be able to instantiate the S3 cache implementation without a bucket', function () {
            (function () {
                lib.cache('s3', {});
            }).should.throw('Missing Required Argument [bucket]');
        });
        it('Shouldn\'t be able to instantiate the S3 cache implementation with an invalid bucket', function () {
            (function () {
                lib.cache('s3',
                    {
                        bucket: {}
                    }
                );
            }).should.throw('Invalid Argument Type Expected [string] for [bucket] but got [object]');
        });
        it('Shouldn\'t be able to instantiate the S3 cache implementation without an access key id', function () {
            (function () {
                lib.cache('s3',
                    {
                        bucket: 'test'
                    }
                );
            }).should.throw('Missing Required Argument [accessKeyId]');
        });
        it('Shouldn\'t be able to instantiate the S3 cache implementation with an invalid access key id', function () {
            (function () {
                lib.cache('s3',
                    {
                        bucket: 'test',
                        accessKeyId: {}
                    }
                );
            }).should.throw('Invalid Argument Type Expected [string] for [accessKeyId] but got [object]');
        });
        it('Shouldn\'t be able to instantiate the S3 cache implementation without a secret access key', function () {
            (function () {
                lib.cache('s3',
                    {
                        bucket: 'test',
                        accessKeyId: 'test'
                    }
                );
            }).should.throw('Missing Required Argument [secretAccessKey]');
        });
        it('Shouldn\'t be able to instantiate the S3 cache implementation with an invalid secret access key', function () {
            (function () {
                lib.cache('s3',
                    {
                        bucket: 'test',
                        accessKeyId: 'test',
                        secretAccessKey: {}
                    }
                );
            }).should.throw('Invalid Argument Type Expected [string] for [secretAccessKey] but got [object]');
        });
        it('Should instantiate the S3 cache implementation', function () {
            var cache = lib.cache('s3',
                {
                    bucket: 'test',
                    accessKeyId: 'test',
                    secretAccessKey: 'test'
                }
            );
            cache.constructor.name.should.be.exactly('S3Cache');
        });
        it('Should be able to save a cached value', function (done) {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            cache.save(JSON.stringify({name: 'Zul'}), 'save-test').then(function (data) {
                try {
                    data.etag.should.be.exactly('5bf48f033197ecd3635f459c145b0815');
                    done();
                } catch (err) {
                    done(err);
                }
            }, function (reason) {
                done(reason);
            });
        });
        it('Should be able to save a cached value with a hash that doesn\'t exist', function (done) {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            cache.save(JSON.stringify({name: 'Zul'}), 'save-test-no-exist', '5bf48f033197ecd3635f459c145b0815').then(function (data) {
                try {
                    data.etag.should.be.exactly('5bf48f033197ecd3635f459c145b0815');
                    done();
                } catch (err) {
                    done(err);
                }
            }, function (reason) {
                done(reason);
            });
        });
        it('Should be able to update a cached value', function (done) {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            cache.save(JSON.stringify({name: 'Zul'}), 'update-test').then(function () {
                cache.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', '5bf48f033197ecd3635f459c145b0815').then(function (data) {
                    try {
                        data.etag.should.be.exactly('d9b4bc4b39054b07b6f2512abcdad03f');
                        done();
                    } catch (err) {
                        done(err);
                    }
                }, function (reason) {
                    done(reason);
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Shouldn\'t be able to update a cached value when you have the wrong hash', function (done) {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            cache.save(JSON.stringify({name: 'Zul'}), 'update-test').then(function () {
                cache.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', '5bf48f033197ecd3635f459c145b08151').then(function () {
                    done(new Error('This should have failed'));
                }, function (reason) {
                    try {
                        var errCode = errors.errorCodes.HASH_MISMATCH;
                        reason.code.should.be.exactly(errCode.code);
                        reason.message.should.be.exactly(util.format(errCode.message, '5bf48f033197ecd3635f459c145b08151', '5bf48f033197ecd3635f459c145b0815'));
                        reason.name.should.be.exactly(errCode.name);
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Should be able to update a cached value that no longer exists', function (done) {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            cache.save(JSON.stringify({name: 'Zul'}), 'does-not-exist').then(function (data) {
                try {
                    data.etag.should.be.exactly('5bf48f033197ecd3635f459c145b0815');
                    done();
                } catch (err) {
                    done(err);
                }
            }, function (reason) {
                done(reason);
            });
        });
        it('Should be able to restore a cached value', function (done) {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            cache.save(JSON.stringify({name: 'Zul'}), 'restore-test').then(function () {
                cache.restore('restore-test').then(function (data) {
                    try {
                        data.etag.should.be.exactly('5bf48f033197ecd3635f459c145b0815');
                        data.body.should.be.exactly(JSON.stringify({name: 'Zul'}));
                        done();
                    } catch (err) {
                        done(err);
                    }
                }, function (reason) {
                    done(reason);
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Shouldn\'t restore the same version', function (done) {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            cache.save(JSON.stringify({name: 'Zul'}), 'restore-test').then(function () {
                cache.restore('restore-test', '5bf48f033197ecd3635f459c145b0815').then(function (data) {
                    try {
                        data.etag.should.be.exactly('5bf48f033197ecd3635f459c145b0815');
                        should.not.exist(data.body);
                        done();
                    } catch (err) {
                        done(err);
                    }
                }, function (reason) {
                    done(reason);
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Should restore if a different version exists', function (done) {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            cache.save(JSON.stringify({name: 'Zul'}), 'restore-test').then(function () {
                cache.restore('restore-test', 'test-hash').then(function (data) {
                    try {
                        data.etag.should.be.exactly('5bf48f033197ecd3635f459c145b0815');
                        data.body.should.be.exactly(JSON.stringify({name: 'Zul'}));
                        done();
                    } catch (err) {
                        done(err);
                    }
                }, function (reason) {
                    done(reason);
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Shouldn\'t restore if a value doesn\'t exist', function (done) {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            cache.restore('doesnt-exist').then(function () {
                done(new Error('Should Have Returned Error'));
            }, function (reason) {
                try {
                    reason.code.should.be.exactly(2);
                    reason.message.should.be.exactly('Cache for [doesnt-exist] not found');
                    reason.name.should.be.exactly('CacheNotFound');
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
        it('Should be able to remove a cached value', function (done) {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            cache.save(JSON.stringify({name: 'Zul'}), 'delete-test').then(function () {
                cache.remove('delete-test').then(function () {
                    done();
                }, function (reason) {
                    done(reason);
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Should be able to remove a cached value with a hash', function (done) {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            cache.save(JSON.stringify({name: 'Zul'}), 'delete-test').then(function () {
                cache.remove('delete-test', '5bf48f033197ecd3635f459c145b0815').then(function () {
                    done();
                }, function (reason) {
                    done(reason);
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Shouldn\'t be able to remove a cached value with an incorrect hash', function (done) {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            cache.save(JSON.stringify({name: 'Zul'}), 'delete-test').then(function () {
                cache.remove('delete-test', 'incorrect-hash').then(function () {
                    done(new Error('Should Have Returned Error'));
                }, function (reason) {
                    try {
                        reason.code.should.be.exactly(0);
                        reason.message.should.be.exactly('Provided Hash [incorrect-hash] doesn\'t match current hash [5bf48f033197ecd3635f459c145b0815]');
                        reason.name.should.be.exactly('HashMismatch');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Shouldn\'t be able to remove a cached value that doesn\'t exist', function (done) {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            cache.remove('delete-test-no-exist').then(function () {
                done(new Error('Should Have Returned Error'));
            }, function (reason) {
                try {
                    reason.code.should.be.exactly(2);
                    reason.message.should.be.exactly('Cache for [delete-test-no-exist] not found');
                    reason.name.should.be.exactly('CacheNotFound');
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
        it('Should be able to save, restore, and delete a cached value with invalid characters', function (done) {
            // See http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#object-keys for where these characters came from
            var cache = lib.cache('s3',
                    {
                        bucket: bucketName,
                        accessKeyId: s3Credentials.accessKeyId,
                        secretAccessKey: s3Credentials.secretAccessKey
                    }
                ),
                dataToCache = JSON.stringify({name: 'Zul'}),
                key = '*$@=;:+    ,?\\{^}%`]\'\'>[~<#|';
            cache.save(dataToCache, key).then(function () {
                return cache.restore(key).then(function (data) {
                    data.body.should.be.exactly(dataToCache);
                    return cache.remove(key).then(function () {
                        return cache.restore(key).then(function () {
                            done(new Error('Should Have Returned Error'));
                        }, function (reason) {
                            try {
                                reason.code.should.be.exactly(2);
                                reason.name.should.be.exactly('CacheNotFound');
                                done();
                            } catch (err) {
                                done(err);
                            }
                        });
                    });
                });
            }, function (reason) {
                done(reason);
            });
        });
    });
}(require('should'), require('util'), require('../index'), require('../lib/errors'), require('s3fs')));