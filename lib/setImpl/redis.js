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
(function (module, inherit, Interface, Promise, EventEmitter, RedisCache, uuid, util) {
    var requiredArgs = [
            {
                name: 'redisClient',
                type: 'object'
            }
        ],
        hset = ['get', 'set', 'del', 'exists'];

    /**
     * Create an instance of the S3 cache implementation.
     * @param key `String`. **Required**. the set key
     * @param parent `Object`. **Required**. The parent to use to create the S3 client
     * @returns {RedisSet} An implementation of the set interface using Amazon S3 as the storage system
     * @constructor
     */
    function RedisSet(key, parent) {
        if (!(this instanceof RedisSet)) {
            return new RedisSet(key, parent);
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

        var redisSetProxyClient = {};
        hset.forEach(function (command) {
            redisSetProxyClient[command] = self.redisClient['h' + command].bind(self.redisClient, key);
            self[command + 'Async'] = Promise.promisify(redisSetProxyClient[command]);
        });

        redisSetProxyClient.destroy = Promise.promisify(self.redisClient.del.bind(self.redisClient, key));
        redisSetProxyClient.getKeys = function (cb) {
            parent.redisClient.hkeys(key, function (err, keys) {
                if (err) {
                    return cb(err);
                }
                return cb(err, keys);
            });
        };

        self.getKeysAsync = Promise.promisify(redisSetProxyClient.getKeys);

        self.redisClient = redisSetProxyClient;
        self.emit('ready');
    }

    inherit(RedisSet, RedisCache, EventEmitter, Interface);

    //override set
    RedisSet.prototype.set = function () {
        throw new Error('Cannot call set of a set instance');
    };

    RedisSet.prototype.destroy = function () {
        var self = this;
        this.redisClient.destroy().then(function () {
            self.emit('destroy');
        });
    };

    module.exports = RedisSet;
}(module, require('inherit-multiple'), require('../setInterface'), require('bluebird'), require('events').EventEmitter, require('../cacheImpl/redis'), require('uuid'), require('util')));