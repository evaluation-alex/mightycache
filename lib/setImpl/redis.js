/**
 * Created by jhorlin.dearmas on 1/29/2015.
 */
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
(function (module, util, setInterface, Q, errors, EventEmitter, RedisCache) {
    'use strict';
    var requiredArgs = [
        {
            name: 'redisClient',
            type: 'object'
        }
        ],
        hset = ['get', 'set', 'del', 'keys'];

    /**
     * Create an instance of the S3 cache implementation.
     *  @property {string} `key`. **Required**. the set key
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
        hset.forEach(function(command){
           redisSetProxyClient[command] = self.redisClient['h' + command].bind(self.redisClient, key);
        });

        redisSetProxyClient.destroy = self.redisClient.del.bind(self.redisClient, key);

        self.redisClient = redisSetProxyClient;

    }

    util.inherits(RedisSet, setInterface);
    util.inherits(RedisSet, RedisCache);
    util.inherits(RedisSet, EventEmitter);

    //remove set from the prototype
    delete RedisSet.prototype.set;

    RedisSet.prototype.destroy = function () {
        var deferred = q.defer();
        this.redisClient.destroy(deferred.makeNodeResolver);
        return deferred.promise;
    };

    module.exports = RedisSet;
}(module, require('util'), require('../setInterface'), require('q'), require('../errors'), require('events').EventEmitter, require('../cacheImpl/redis')));