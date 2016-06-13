'use strict';
/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014-2016 Riptide Software Inc.
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
(function (expect, errors) {
    describe('Errors Implementation', function () {
        it('Should be able to instantiate an error without the \'new\' keyword', function () {
            var err = errors.errorCodes.HASH_MISMATCH,
                errObj = errors.CacheError(err.name, err.message, err.code);

            expect(errObj).to.be.an.instanceof(errors.CacheError);
        });
        it('Should be able to instantiate an error with the \'new\' keyword', function () {
            var err = errors.errorCodes.HASH_MISMATCH,
                errObj = new errors.CacheError(err.name, err.message, err.code);

            expect(errObj).to.be.an.instanceof(errors.CacheError);
        });
    });
}(require('./chaiPromise').expect, require('../lib/errors')));