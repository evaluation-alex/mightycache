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
(function (module, cacheInterface, util, Q, errors, JSSHA) {
    'use strict';
    var cache = {};

    /**
     * Create an instance of the In-Memory Cache Implementation meant for use with testing
     *
     * @param options `Object`. **Required**. The options to use to create the in-memory cache
     * @returns {TestCache} An implementation of the cache interface using Memory as the storage system
     * @constructor
     */
    function TestCache(options) {
        if (!(this instanceof TestCache)) {
            return new TestCache(options);
        }
    }

    util.inherits(TestCache, cacheInterface);

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
    TestCache.prototype.save = function (dataToBeCached, key, hashToReplace) {
        var deferred = Q.defer();
        process.nextTick(function () {
            // If we were sent a hash, we only want to update the cache if the hash matches what is currently stored.
            if (hashToReplace) {
                if (!cache[key]) {
                    cache[key] = {
                        hash: getSHA1(dataToBeCached),
                        body: dataToBeCached
                    };
                    deferred.resolve({
                        etag: cache[key].hash
                    });
                } else {
                    var storedHash = cache[key].hash;
                    if (storedHash !== hashToReplace) {
                        var err = errors.errorCodes.HASH_MISMATCH;
                        deferred.reject(new errors.CacheError(err.name, util.format(err.message, hashToReplace, storedHash), err.code));
                    } else {
                        cache[key] = {
                            hash: getSHA1(dataToBeCached),
                            body: dataToBeCached
                        };
                        deferred.resolve({
                            etag: cache[key].hash
                        });
                    }
                }
            } else {
                // We didn't receive a previous hash, so update the cache blindly.
                cache[key] = {
                    hash: getSHA1(dataToBeCached),
                    body: dataToBeCached
                };
                deferred.resolve({
                    etag: cache[key].hash
                });
            }
        });
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
    TestCache.prototype.restore = function (key, ifNewerHash) {
        var deferred = Q.defer();

        process.nextTick(function () {
            if (cache[key]) {
                var storedHash = cache[key].hash;
                // If we were sent a hash, only return data if it doesn't match what is currently stored.
                if (ifNewerHash && ifNewerHash === storedHash) {
                    deferred.resolve({
                        etag: storedHash
                    });
                } else {
                    deferred.resolve({
                        etag: storedHash,
                        body: cache[key].body
                    });
                }
            } else {
                var err = errors.errorCodes.CACHE_NOT_FOUND;
                deferred.reject(new errors.CacheError(err.name, util.format(err.message, key), err.code));
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
    TestCache.prototype.remove = function (key, hashToDelete) {
        var deferred = Q.defer(),
            err;

        process.nextTick(function () {
            if (cache[key]) {
                if (hashToDelete) {
                    var storedHash = cache[key].hash;
                    // If we have mismatched hashes, something is out-of-sync send back a response so that the client can update.
                    if (storedHash !== hashToDelete) {
                        err = errors.errorCodes.HASH_MISMATCH;
                        deferred.reject(new errors.CacheError(err.name, util.format(err.message, hashToDelete, storedHash), err.code));
                    } else {
                        // Otherwise hashes match, so go ahead and delete the cache.
                        delete cache[key];
                        deferred.resolve();
                    }
                } else {
                    // We didn't receive a previous hash, so delete the cache blindly.
                    delete cache[key];
                    deferred.resolve();
                }
            } else {
                err = errors.errorCodes.CACHE_NOT_FOUND;
                deferred.reject(new errors.CacheError(err.name, util.format(err.message, key), err.code));
            }
        });
        return deferred.promise;
    };

    var getSHA1 = function (data) {
        return new JSSHA(data, 'TEXT').getHash('SHA-1', 'HEX');
    };

    module.exports = TestCache;
}(module, require('../cacheInterface'), require('util'), require('q'), require('../errors'), require('jssha')));