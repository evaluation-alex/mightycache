(function (expect, lib) {
    'use strict';
    describe('Redis Specific Implementation', function () {
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

    });
}(require('./chaiPromise').expect, require('../index')));