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
(function (expect, lib) {
    'use strict';
    describe('Redis Cache Implementation', function () {
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