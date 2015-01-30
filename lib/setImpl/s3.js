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
(function (module, util, setInterface, Q, errors, EventEmitter, S3Cache) {
    'use strict';
    var requiredArgs = [
        {
            name: 'self',
            type: 'object'
        }
    ];

    /**
     * Create an instance of the S3 cache implementation.
     *  @property {string} `key`. **Required**. the set key
     * @param parent `Object`. **Required**. The parent to use to create the S3 client
     * @returns {S3Set} An implementation of the set interface using Amazon S3 as the storage system
     * @constructor
     */
    function S3Set(key, parent) {
        if (!(this instanceof S3Set)) {
            return new S3Set(key, parent);
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

        self.s3fs = self.s3fs.clone(encodeURIComponent(key));

    }

    util.inherits(S3Set, setInterface);
    util.inherits(S3Set, S3Cache);
    util.inherits(S3Set, EventEmitter);

    //remove set from the prototype
    delete S3Set.prototype.set;

    S3Set.prototype.destroy = function () {
        var self = this;
        return self.s3fs.rmdirp().then(function () {
            return self.rmdir();
        }).then(function(){
            self.emit('destroy');
        });
    };

    module.exports = S3Set;
}(module, require('util'), require('../setInterface'), require('q'), require('../errors'), require('events').EventEmitter, require('../cacheImpl/s3')));