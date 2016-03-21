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
(function (module, util) {
    function CacheError(name, message, code) {
        if (!(this instanceof CacheError)) {
            return new CacheError(name, message, code);
        }

        this.name = name;
        this.message = message;
        this.code = code;
    }

    util.inherits(CacheError, Error);

    module.exports.CacheError = CacheError;
    module.exports.errorCodes = {
        HASH_MISMATCH: {
            name: 'HashMismatch',
            message: 'Provided Hash [%s] doesn\'t match current hash [%s]',
            code: 0
        },
        UPDATE_FAILED: {
            name: 'UpdateFailed',
            message: 'Failed to update key [%s]',
            code: 1
        },
        CACHE_NOT_FOUND: {
            name: 'CacheNotFound',
            message: 'Cache for [%s] not found',
            code: 2
        },
        DELETE_FAILED: {
            name: 'DeleteFailed',
            message: 'Failed to delete key [%s]',
            code: 1
        },
        SET_NOT_DEFINED: {
            name: 'SetNotDefined',
            message: 'Set Class is not associated with this cache',
            code: 5
        }
    };
}(module, require('util')));
