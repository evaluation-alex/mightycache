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

(function (module, util, Interface, MemCache, EventEmitter) {
    "use strict";

    function MemSet(key, parent) {
        this.cache = new MemCache({});
    }

    util.inherits(MemSet, Interface);
    util.inherits(MemSet, EventEmitter);

    MemSet.prototype.save = function (dataToBeCached, key, hashToReplace) {
        return this.cache.save(dataToBeCached, key, hashToReplace);
    };

    MemSet.prototype.restore = function (key, ifNewerHash) {
        return this.cache.restore(key, ifNewerHash);
    };

    MemSet.prototype.remove = function (key, hashToDelete) {
        return this.cache.remove(key, hashToDelete);
    };

    MemSet.prototype.keys = function () {
        return this.cache.keys();
    };

    MemSet.prototype.destroy = function () {
        this.emit('destroy');
    };

    MemSet.prototype.set = function(){

    };

}(module, require('util'), require('../setInterface'), require('../cacheImpl/mem'), require('events').EventEmitter));
