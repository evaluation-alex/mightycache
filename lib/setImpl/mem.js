'use strict';
/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014-2016 Riptide Software Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(function (module, process, inherit, Interface, MemCache, EventEmitter, Promise) {

    function MemSet(key, parent) {
        if (!(this instanceof MemSet)) {
            return new MemSet(key, parent);
        }
        var self = this;
        this.cache = new MemCache({});
        process.nextTick(function () {
            self.emit('ready');
        });
    }

    inherit(MemSet, EventEmitter, Interface);

    MemSet.prototype.save = function (dataToBeCached, key, hashToReplace) {
        return this.cache.save(dataToBeCached, key, hashToReplace);
    };

    MemSet.prototype.head = function (key) {
        return this.cache.head(key);
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

    //override set
    MemSet.prototype.set = function () {
        throw new Error('Cannot call set of a set instance');
    };

    MemSet.prototype.destroy = function () {
        this.emit('destroy');
        return Promise.resolve();
    };

    MemSet.prototype.exists = function (key) {
        return this.cache.exists(key);
    };

    MemSet.prototype.clear = function () {
        return this.cache.clear();
    };

    module.exports = MemSet;

}(module, process, require('inherit-multiple'), require('../setInterface'), require('../cacheImpl/mem'), require('events').EventEmitter, require('bluebird')));
