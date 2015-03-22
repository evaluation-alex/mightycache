/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Riptide Software Inc.
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
(function (module, inherit, util, setInterface, cbQ, path, EventEmitter, FSCache) {
    'use strict';
    var requiredArgs = [
        {
            name: 'xfs',
            type: 'object'
        }
    ];

    /**
     * Create an instance of the S3 cache implementation.
     * @param {String} key **Required**. the set key
     * @param {Object} parent **Required**. The parent to use to create the S3 client
     * @returns {FSSet} An implementation of the set interface using a file system as the storage system
     * @constructor
     */
    function FSSet(key, parent) {
        if (!(this instanceof FSSet)) {
            return new FSSet(key, parent);
        }
        var self = this;
        requiredArgs.forEach(function (arg) {
            if (!parent[arg.name]) {
                throw new Error(util.format('Missing Required Argument [%s]', arg.name));
            } else if (typeof parent[arg.name] !== arg.type) {
                throw new Error(util.format('Invalid Argument Type Expected [%s] for [%s] but got [%s]', arg.type, arg.name, typeof parent[arg.name]));
            }
            // If we've passed the checks, go ahead and set it in the current object.
            self[arg.name] = parent[arg.name];
        });

        self.xfs = parent.xfs;
        self.path = path.join(parent.path, key);

        var mkdir = cbQ.cb();
        parent.xfs.mkdir(self.path, mkdir);

        mkdir.promise.then(function () {
            self.emit('ready');
        }, function (err) {
            self.emit('error', err);
        });

    }

    inherit(FSSet, FSCache, EventEmitter, setInterface);

    //override set
    FSSet.prototype.set = function () {
        throw new Error('Cannot call set of a set instance');
    };

    FSSet.prototype.destroy = function () {
        var self = this,
            rmdir = cbQ.cb();
        self.xfs.rmdir(this.path, rmdir);
        return rmdir.promise.then(function () {
            self.emit('destroy');
        });
    };

    module.exports = FSSet;
}(module, require('inherit-multiple'), require('util'), require('../setInterface'), require('cb-q'), require('path'), require('events').EventEmitter, require('../cacheImpl/fs')));