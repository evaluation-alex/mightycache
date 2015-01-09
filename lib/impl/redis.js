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
(function (module, cacheInterface, util, Q, errors, JSSHA, EventEmitter, redis) {
    'use strict';
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
        var self = this;
        if (!(this instanceof RedisCache)) {
            return new RedisCache(options);
        }
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
        self.redisClient.on('error', function (err) {
            self.emit('error', err);
        });
    }

    util.inherits(RedisCache, EventEmitter);

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
     * @returns {Q.promise}
     */
    RedisCache.prototype.save = function (dataToBeCached, key, hashToReplace) {
        var self = this,
            deferred = Q.defer();
        // If we were sent a hash, we only want to update the cache if the hash matches what is currently stored.
        if (hashToReplace) {
            self.redisClient.get(key, function (redisErr, data) {
                if (redisErr || !data) {
                    // If we try to update a key that doesn't exist, update it anyways.
                    self.redisClient.set(key, dataToBeCached, function (redisErr) {
                        if (redisErr) {
                            var err = errors.errorCodes.UPDATE_FAILED;
                            return deferred.reject(new errors.CacheError(err.name, util.format(err.message, key) + ' - ' + redisErr, err.code));
                        }

                        deferred.resolve({
                            etag: getSHA1(dataToBeCached)
                        });
                    });
                } else {
                    var storedHash = getSHA1(data);
                    // If we have mismatched hashes, something is out-of-sync send back a response so that the client can update.
                    if (storedHash !== hashToReplace) {
                        var err = errors.errorCodes.HASH_MISMATCH;
                        deferred.reject(new errors.CacheError(err.name, util.format(err.message, hashToReplace, storedHash), err.code));
                    } else {
                        // Otherwise hashes match, so go ahead and update the cache.
                        self.redisClient.set(key, dataToBeCached, function(redisErr){
                            if (redisErr) {
                                var err = errors.errorCodes.UPDATE_FAILED;
                                return deferred.reject(new errors.CacheError(err.name, util.format(err.message, key) + ' - ' + redisErr, err.code));
                            }
                            deferred.resolve({
                                etag: getSHA1(dataToBeCached)
                            });
                        });
                    }
                }
            });
        } else {
            // We didn't receive a previous hash, so update the cache blindly.
            self.redisClient.set(key, dataToBeCached, function(redisErr){
                if (redisErr) {
                    var err = errors.errorCodes.UPDATE_FAILED;
                    return deferred.reject(new errors.CacheError(err.name, util.format(err.message, key), err.code));
                }

                deferred.resolve({
                    etag: getSHA1(dataToBeCached)
                });
            });
        }
        return deferred.promise;
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
     * @returns {Q.promise}
     */
    RedisCache.prototype.restore = function (key, ifNewerHash) {
        var self = this,
            deferred = Q.defer();

        self.redisClient.get(key, function(redisErr, data){
            if (redisErr || !data) {
                var err = errors.errorCodes.CACHE_NOT_FOUND;
                return deferred.reject(new errors.CacheError(err.name, util.format(err.message, key), err.code));
            }

            var storedHash = getSHA1(data);
            // If we were sent a hash, only return data if it doesn't match what is currently stored.
            if (ifNewerHash && ifNewerHash === storedHash) {
                deferred.resolve({
                    etag: storedHash
                });
            } else {
                deferred.resolve({
                    etag: storedHash,
                    body: data
                });
            }
        });
        return deferred.promise;
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
     * @returns {Q.promise}
     */
    RedisCache.prototype.remove = function (key, hashToDelete) {
        var self = this,
            deferred = Q.defer(),
            err;

        self.redisClient.get(key, function(redisErr, data){
            if (redisErr || !data) {
                err = errors.errorCodes.CACHE_NOT_FOUND;
                return deferred.reject(new errors.CacheError(err.name, util.format(err.message, key), err.code));
            }

            if (hashToDelete) {
                var storedHash = getSHA1(data);
                // If we have mismatched hashes, something is out-of-sync send back a response so that the client can update.
                if (storedHash !== hashToDelete) {
                    err = errors.errorCodes.HASH_MISMATCH;
                    deferred.reject(new errors.CacheError(err.name, util.format(err.message, hashToDelete, storedHash), err.code));
                } else {
                    // Otherwise hashes match, so go ahead and delete the cache.
                    self.redisClient.del(key, function(redisErr) {
                        if (redisErr) {
                            var err = errors.errorCodes.DELETE_FAILED;
                            return deferred.reject(new errors.CacheError(err.name, util.format(err.message, key) + ' - ' + redisErr, err.code));
                        }
                        deferred.resolve();
                    });
                }
            } else {
                // We didn't receive a previous hash, so delete the cache blindly.
                self.redisClient.del(key, function(redisErr) {
                    if (redisErr) {
                        var err = errors.errorCodes.DELETE_FAILED;
                        return deferred.reject(new errors.CacheError(err.name, util.format(err.message, key), err.code));
                    }
                    deferred.resolve();
                });
            }
        });
        return deferred.promise;
    };

    var getSHA1 = function (data) {
        return new JSSHA(data, 'TEXT').getHash('SHA-1', 'HEX');
    };

    module.exports = RedisCache;
}(module, require('../cacheInterface'), require('util'), require('q'), require('../errors'), require('jssha'),
    require('events').EventEmitter, require('redis')));