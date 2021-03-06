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
(function (module, cacheInterface, inherit, util, Promise, errors, crypto, EventEmitter, redis) {
    var requiredArgs = [
        {
            name: 'host',
            type: 'string'
        },
        {
            name: 'port',
            type: 'number'
        },
        {
            name: 'options',
            type: 'object'
        }
    ];

    /**
     * Create an instance of the Redis cache implementation.
     *
     * @param options `Object`. **Required**. The options to use to create the Redis cache
     * @property host `String`. **Required**. The Redis hostname
     * @property port `Number`. **Required**. The Redis port
     * @property options `Object`. **Required**. The secret access key to use to authenticate to S3
     * @returns {RedisCache} An implementation of the cache interface using Redis as the storage system
     * @constructor
     */
    function RedisCache(options) {
        if (!(this instanceof RedisCache)) {
            return new RedisCache(options);
        }
        var self = this,
            sets = {};
        EventEmitter.call(self);

        requiredArgs.forEach(function (arg) {
            if (!options[arg.name]) {
                throw new Error(util.format('Missing Required Argument [%s]', arg.name));
            } else if (typeof options[arg.name] !== arg.type) {
                throw new Error(util.format('Invalid Argument Type Expected [%s] for [%s] but got [%s]', arg.type, arg.name, typeof options[arg.name]));
            }
            // If we've passed the checks, go ahead and set it in the current object.
            self[arg.name] = options[arg.name];
        });

        self.redisClient = redis.createClient(self.port, self.host, self.options);
        self.redisClient.getKeys = self.redisClient.keys.bind(self.redisClient, '*');

        self.getAsync = Promise.promisify(self.redisClient.get).bind(self.redisClient);
        self.getKeysAsync = Promise.promisify(self.redisClient.getKeys).bind(self.redisClient);
        self.setAsync = Promise.promisify(self.redisClient.set).bind(self.redisClient);
        self.delAsync = Promise.promisify(self.redisClient.del).bind(self.redisClient);
        self.existsAsync = Promise.promisify(self.redisClient.exists).bind(self.redisClient);

        self.redisClient.on('error', function (err) {
            self.emit('error', err);
        });

        this.getOrCreateSet = function getOrCreateSet(key) {
            if (RedisCache.Set) {
                if (!(key in sets)) {
                    sets[key] = new Promise(function (resolve, reject) {
                        var setInstance = new RedisCache.Set(key, self);
                        setInstance.on('destroy', function () {
                            delete sets[key];
                        });
                        resolve(setInstance);
                    });
                }
                return sets[key];
            }

            var err = errors.errorCodes.SET_NOT_DEFINED;
            return Promise.reject(new errors.CacheError(err.name, err.message, err.code));
        };

    }

    inherit(RedisCache, cacheInterface, EventEmitter);

    /**
     * Stores the data for the provided key.
     *
     * @example
     * ```js
     * var cache = cacheModule.cache(cacheImplName, options);
     * cache.save('Test Data', 'test-key').then(function(data) {
     *   // Data successfully stored `data.etag` has the etag that was generated
     * }, function(reason) {
     *   // Something went wrong
     * });
     * ```
     *
     * @param dataToBeCached `String`. **Required**. The data to be stored
     * @param key `String`. **Required**. Identifies the data being stored, used later to retrieve, update, or restore the cache
     * @param hashToReplace `String` _Optional_ If provided, only updates the cache when the hash value provided is the same as what is currently stored. If there isn't a cache currently created it will persist the data regardless.
     * @returns {Promise}
     */
    RedisCache.prototype.save = function (dataToBeCached, key, hashToReplace) {
        var self = this,
            savePromise;
        // If we were sent a hash, we only want to update the cache if the hash matches what is currently stored.
        if (hashToReplace) {
            savePromise = self.getAsync(key).then(function (data) {
                if (!data) {
                    // If we try to update a key that doesn't exist, update it anyways.
                    return self.setAsync(key, dataToBeCached);
                }
                var storedHash = getSHA1(data);
                // If we have mismatched hashes, something is out-of-sync send back a response so that the client can update.
                if (storedHash !== hashToReplace) {
                    var cacheError = errors.errorCodes.HASH_MISMATCH;
                    throw new errors.CacheError(cacheError.name, util.format(cacheError.message, hashToReplace, storedHash), cacheError.code);
                } else {
                    // Otherwise hashes match, so go ahead and update the cache.
                    return self.setAsync(key, dataToBeCached);
                }
            });
        } else {
            // We didn't receive a previous hash, so update the cache blindly.
            savePromise = self.setAsync(key, dataToBeCached);
        }

        return savePromise.return({
            etag: getSHA1(dataToBeCached)
        });
    };

    /**
     * Retrieves the metadata for the provided key.
     *
     * @example
     * ```js
     * var cache = cacheModule.cache(cacheImplName, options);
     * cache.head('test-key').then(function(data) {
     *   // Metadata successfully retrieved, `data.etag` has the hash of the currently cached value
     * }, function(reason) {
     *   // Something went wrong
     * });
     * ```
     *
     * @param key `String`. **Required**. Identifies the data being retrieved
     * @returns {Promise}
     */
    RedisCache.prototype.head = function (key) {
        return this.getAsync(key).then(function (data) {
            if (!data) {
                var err = errors.errorCodes.CACHE_NOT_FOUND;
                throw new errors.CacheError(err.name, util.format(err.message, key), err.code);
            }

            return {
                etag: getSHA1(data)
            };
        });
    };

    /**
     * Restores the cached data for the provided key.
     *
     * @example
     * ```js
     * var cache = cacheModule.cache(cacheImplName, options);
     * cache.restore('test-key').then(function(data) {
     *   // Data successfully retrieved, `data.etag` has the hash of it and `data.body` has the data that was cached
     * }, function(reason) {
     *   // Something went wrong
     * });
     * ```
     *
     * @param key `String`. **Required**. Identifies the data being retrieved
     * @param ifNewerHash `String`. _Optional_. If provided only retrieves the cached data if the hashes do not match, otherwise it just retrieves everything
     * @returns {Promise}
     */
    RedisCache.prototype.restore = function (key, ifNewerHash) {
        return this.getAsync(key).then(function (data) {
            if (!data) {
                var err = errors.errorCodes.CACHE_NOT_FOUND;
                throw new errors.CacheError(err.name, util.format(err.message, key), err.code);
            }

            var result = {
                etag: getSHA1(data)
            };
            // If we were sent a hash, only return data if it doesn't match what is currently stored.
            if (ifNewerHash && ifNewerHash === result.etag) {
                return result;
            }
            result.body = data;
            return result;
        });
    };

    /**
     * Deletes the cached data for the provided key.
     *
     * @example
     * ```js
     * var cache = cacheModule.cache(cacheImplName, options);
     * cache.remove('test-key').then(function() {
     *   // Cache successfully deleted
     * }, function(reason) {
     *   // Something went wrong
     * });
     * ```
     *
     * @param key `String`. **Required**. Identifies the data being deleted
     * @param hashToDelete `String`. _Optional_. If provided only deletes the cache if the hashes match, otherwise it just deletes the cache
     * @returns {Promise}
     */
    RedisCache.prototype.remove = function (key, hashToDelete) {
        var self = this,
            err;

        return self.getAsync(key).then(function (data) {
            if (!data) {
                err = errors.errorCodes.CACHE_NOT_FOUND;
                throw new errors.CacheError(err.name, util.format(err.message, key), err.code);
            }

            if (hashToDelete) {
                var storedHash = getSHA1(data);
                // If we have mismatched hashes, something is out-of-sync send back a response so that the client can update.
                if (storedHash !== hashToDelete) {
                    err = errors.errorCodes.HASH_MISMATCH;
                    throw new errors.CacheError(err.name, util.format(err.message, hashToDelete, storedHash), err.code);
                } else {
                    // Otherwise hashes match, so go ahead and delete the cache.
                    return self.delAsync(key);
                }
            } else {
                // We didn't receive a previous hash, so delete the cache blindly.
                return self.redisClient.del(key);
            }
        });
    };

    /**
     * Returns a list of keys.
     *
     * @example
     * ```js
     * var cache = cacheModule.cache(cacheImplName, options);
     * var cacheSet = cache.keys().then(function(keyList){
     *     //use the set instance
     * }, function(reason){
     *      //OOPS!!
     * });
     * ```
     *
     * @returns {Promise}
     */
    RedisCache.prototype.keys = function () {
        return this.getKeysAsync();
    };

    /**
     * Returns a cache Set instance.
     *
     * @example
     * ```js
     * var cache = cacheModule.cache(cacheImplName, options);
     * var cacheSet = cache.set('set-key')
     * ```
     * @param {String} setKey. **Required**
     * @returns {RedisSet}
     */
    RedisCache.prototype.set = function (setKey) {
        return this.getOrCreateSet(setKey);
    };

    /**
     * Tests the existence of a cached item based on key
     * @example
     * ```javascript
     * var cache = cacheModule.cache(cacheImplName, options);
     * cache.exists(key).then(function(exists){
     *      true if the item exists
     * })
     * ```
     * @param {string} key - key value used for cached item
     * @returns {Promise}
     */
    RedisCache.prototype.exists = function (key) {
        return this.existsAsync(key).then(function (result) {
            return result === 1; // Redis returns 0/1 not true/false. See: http://redis.io/commands/exists
        });
    };

    /**
     * Removes all cached items from the set.
     * @returns {Promise}
     */
    RedisCache.prototype.clear = function () {
        var self = this;
        return self.getKeysAsync()
            .then(function (keys) {
                return Promise.all(keys.map(self.delAsync));
            });
    };

    function getSHA1(data) {
        return crypto.createHash('sha1').update(data).digest('hex');
    }

    module.exports = RedisCache;
}(module, require('../cacheInterface'), require('inherit-multiple'), require('util'), require('bluebird'), require('../errors'), require('crypto'),
    require('events').EventEmitter, require('redis')));