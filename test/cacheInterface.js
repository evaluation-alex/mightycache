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
(function (expect, lib, util) {
    'use strict';
    describe('Cache Interface', function () {
        it('Should receive error when not using an impl name', function () {
            expect(function () {
                lib.cache();
            }).to.throw('Impl is required and must be a string');
        });
        it('Should receive error when using an invalid impl name type', function () {
            expect(function () {
                lib.cache({});
            }).to.throw('Impl is required and must be a string');
        });
        it('Should receive error when not using options', function () {
            expect(function () {
                lib.cache('test');
            }).to.throw('Options is required and must be an object');
        });
        it('Should receive error when using an invalid options type', function () {
            expect(function () {
                lib.cache('Egon', 'Spengler');
            }).to.throw('Options is required and must be an object');
        });
        it('Should receive error when trying to use an impl that doesn\'t exist', function () {
            expect(function () {
                lib.cache('does-not-exist', {});
            }).to.throw('Implementation [does-not-exist] does not exist');
        });
        it('Should receive error when accessing the un-implemented \'save\' method', function () {
            expect(function () {
                var farceCache = new FarceCache();
                farceCache.save();
            }).to.throw('function save not implemented');
        });
        it('Should receive error when accessing the un-implemented \'restore\' method', function () {
            expect(function () {
                var farceCache = new FarceCache();
                farceCache.restore();
            }).to.throw('function restore not implemented');
        });
        it('Should receive error when accessing the un-implemented \'remove\' method', function () {
            expect(function () {
                var farceCache = new FarceCache();
                farceCache.remove();
            }).to.throw('function remove not implemented');
        });
    });

    function FarceCache() {
    }

    util.inherits(FarceCache, lib.cacheInterface);

}(require('./chaiPromise').expect, require('../index'), require('util')));