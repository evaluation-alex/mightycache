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
(function (expect, lib, util) {
    describe('Set Interface', function () {
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
        it('Should receive error when accessing the un-implemented \'keys\' method', function () {
            expect(function () {
                var farceCache = new FarceCache();
                farceCache.keys();
            }).to.throw('function keys not implemented');
        });
    });

    function FarceCache() {
    }

    util.inherits(FarceCache, lib.setInterface);

}(require('./chaiPromise').expect, require('../index'), require('util')));