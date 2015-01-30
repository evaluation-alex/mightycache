(function (expect, util, lib, errors, S3FS) {
    'use strict';
    describe('S3 Cache Implementation', function () {
        var dataToSave = {
                name: 'Zul'
            },
            s3Credentials,
            bucketName,
            s3fsImpl;

        beforeEach(function () {
            s3Credentials = {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_KEY,
                region: process.env.AWS_REGION
            };
            bucketName = 's3fs-cache-test-bucket-' + (Math.random() + '').slice(2, 8);
            s3fsImpl = new S3FS(s3Credentials, bucketName);

            return s3fsImpl.create();
        });

        afterEach(function () {
            return s3fsImpl.destroy();
        });

        it('Shouldn\'t be able to instantiate the S3 cache implementation without a bucket', function () {
            expect(function () {
                lib.cache('s3', {});
            }).to.throw('Missing Required Argument [bucket]');
        });
        it('Shouldn\'t be able to instantiate the S3 cache implementation with an invalid bucket', function () {
            expect(function () {
                lib.cache('s3',
                    {
                        bucket: {}
                    }
                );
            }).to.throw('Invalid Argument Type Expected [string] for [bucket] but got [object]');
        });
        it('Shouldn\'t be able to instantiate the S3 cache implementation without an access key id', function () {
            expect(function () {
                lib.cache('s3',
                    {
                        bucket: 'test'
                    }
                );
            }).to.throw('Missing Required Argument [accessKeyId]');
        });
        it('Shouldn\'t be able to instantiate the S3 cache implementation with an invalid access key id', function () {
            expect(function () {
                lib.cache('s3',
                    {
                        bucket: 'test',
                        accessKeyId: {}
                    }
                );
            }).to.throw('Invalid Argument Type Expected [string] for [accessKeyId] but got [object]');
        });
        it('Shouldn\'t be able to instantiate the S3 cache implementation without a secret access key', function () {
            expect(function () {
                lib.cache('s3',
                    {
                        bucket: 'test',
                        accessKeyId: 'test'
                    }
                );
            }).to.throw('Missing Required Argument [secretAccessKey]');
        });
        it('Shouldn\'t be able to instantiate the S3 cache implementation with an invalid secret access key', function () {
            expect(function () {
                lib.cache('s3',
                    {
                        bucket: 'test',
                        accessKeyId: 'test',
                        secretAccessKey: {}
                    }
                );
            }).to.throw('Invalid Argument Type Expected [string] for [secretAccessKey] but got [object]');
        });
        it('Should instantiate the S3 cache implementation', function () {
            var cache = lib.cache('s3',
                {
                    bucket: 'test',
                    accessKeyId: 'test',
                    secretAccessKey: 'test'
                }
            );
            expect(cache).to.be.ok();
        });
        it('Should be able to save a cached value', function () {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            return expect(cache.save(JSON.stringify(dataToSave), 'save-test')).to.eventually.deep.equal({etag: '5bf48f033197ecd3635f459c145b0815'});
        });
        it('Should be able to save a cached value with a hash that doesn\'t exist', function () {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            return expect(cache.save(JSON.stringify(dataToSave), 'save-test-no-exist', '5bf48f033197ecd3635f459c145b0815')).to.eventually.deep.equal({etag: '5bf48f033197ecd3635f459c145b0815'});
        });
        it('Should be able to update a cached value', function () {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            return cache.save(JSON.stringify(dataToSave), 'update-test').then(function (data) {
                return expect(cache.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', data.etag)).to.eventually.deep.equal({etag: 'd9b4bc4b39054b07b6f2512abcdad03f'});
            });
        });
        it('Should be able to update a cached value that no longer exists', function () {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            return expect(cache.save(JSON.stringify(dataToSave), 'does-not-exist')).to.eventually.deep.equal({etag: '5bf48f033197ecd3635f459c145b0815'});
        });
        it('Shouldn\'t be able to update a cached value when you have the wrong hash', function () {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            return cache.save(JSON.stringify(dataToSave), 'update-test').then(function (data) {
                return expect(cache.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', data.etag + '1')).to.eventually.be
                    .rejectedWith(errors.CacheError, util.format(errors.errorCodes.HASH_MISMATCH.message, data.etag + '1', data.etag));
            });
        });
        it('Should be able to restore a cached value', function () {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
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
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            return cache.save(JSON.stringify(dataToSave), 'restore-test').then(function (data) {
                return expect(cache.restore('restore-test', data.etag)).to.eventually.deep.equal(data);
            });
        });
        it('Should restore if a different version exists', function () {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
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
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            return expect(cache.restore('doesnt-exist')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.CACHE_NOT_FOUND.message, 'doesnt-exist'));
        });
        it('Should be able to remove a cached value', function () {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            return cache.save(JSON.stringify(dataToSave), 'delete-test').then(function () {
                return expect(cache.remove('delete-test')).to.eventually.be.fulfilled;
            });
        });
        it('Should be able to remove a cached value with a hash', function () {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            return cache.save(JSON.stringify(dataToSave), 'delete-test').then(function (data) {
                return expect(cache.remove('delete-test', data.etag)).to.eventually.be.fulfilled;
            });
        });
        it('Shouldn\'t be able to remove a cached value with an incorrect hash', function () {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            return cache.save(JSON.stringify(dataToSave), 'delete-test').then(function (data) {
                return expect(cache.remove('delete-test', 'incorrect-hash')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.HASH_MISMATCH.message, 'incorrect-hash', data.etag));
            });
        });
        it('Shouldn\'t be able to remove a cached value that doesn\'t exist', function () {
            var cache = lib.cache('s3',
                {
                    bucket: bucketName,
                    accessKeyId: s3Credentials.accessKeyId,
                    secretAccessKey: s3Credentials.secretAccessKey
                }
            );
            return expect(cache.remove('delete-test-no-exist')).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.CACHE_NOT_FOUND.message, 'delete-test-no-exist'));
        });
        it('Should be able to save, restore, and delete a cached value with invalid characters', function () {
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
            return cache.save(dataToCache, key).then(function () {
                return cache.restore(key).then(function (data) {
                    expect(data.body).to.equal(dataToCache);
                    return cache.remove(key).then(function () {
                        return expect(cache.restore(key)).to.eventually.be.rejectedWith(errors.CacheError, util.format(errors.errorCodes.CACHE_NOT_FOUND.message, key));
                    });
                });
            });
        });
    });
}(require('./helper').getExpect(), require('util'), require('../index'), require('../lib/errors'), require('s3fs')));