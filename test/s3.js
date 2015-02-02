(function (expect, lib) {
    'use strict';
    describe('S3 Implementation Specific Tests', function () {
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
    });
}(require('./helper').getExpect(), require('../index')));