(function (expect, lib) {
    'use strict';
    describe('S3 Specific Implementation', function () {
        it('Shouldn\'t be able to instantiate the S3 cache implementation without a bucket', function () {
            expect(function () {
                lib.cache('s3', {});
            }).to.throw(Error, 'Missing Required Argument [bucket]');
        });
        it('Shouldn\'t be able to instantiate the S3 cache implementation with an invalid bucket', function () {
            expect(function () {
                lib.cache('s3',
                    {
                        bucket: {}
                    }
                );
            }).to.throw(Error, 'Invalid Argument Type Expected [string] for [bucket] but got [object]');
        });
        it('Shouldn\'t be able to instantiate the S3 cache implementation without an access key id', function () {
            expect(function () {
                lib.cache('s3',
                    {
                        bucket: 'test'
                    }
                );
            }).to.throw(Error, 'Missing Required Argument [accessKeyId]');
        });
        it('Shouldn\'t be able to instantiate the S3 cache implementation with an invalid access key id', function () {
            expect(function () {
                lib.cache('s3',
                    {
                        bucket: 'test',
                        accessKeyId: {}
                    }
                );
            }).to.throw(Error, 'Invalid Argument Type Expected [string] for [accessKeyId] but got [object]');
        });
        it('Shouldn\'t be able to instantiate the S3 cache implementation without a secret access key', function () {
            expect(function () {
                lib.cache('s3',
                    {
                        bucket: 'test',
                        accessKeyId: 'test'
                    }
                );
            }).to.throw(Error, 'Missing Required Argument [secretAccessKey]');
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
            }).to.throw(Error, 'Invalid Argument Type Expected [string] for [secretAccessKey] but got [object]');
        });
        it('Should instantiate the S3 cache implementation', function () {
            var cache = lib.cache('s3',
                {
                    bucket: 'test',
                    accessKeyId: 'test',
                    secretAccessKey: 'test'
                }
            );
            expect(cache.constructor.name).to.equal('S3Cache');
        });
    });
}(require('./chaiPromise').expect, require('../index')));