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
(function (module, cacheInterface, inherit, util, fs, path, Promise, crypto, errors, fsWishlist) {
    var requiredArgs = [
        {
            name: 'path',
            type: 'string'
        }
    ];

    /**
     * Create an instance of the FS cache implementation.
     *
     * @param options `Object`. **Required**. The options to use to create the cache
     * @property path `String`. **Required**. The cache path
     * @property fs `Object`. **Optional**. An FS implementation to use instead of the default `fs`
     * @returns {FSCache} An implementation of the cache interface using a file system implementation as the storage system
     * @constructor
     */
    function FSCache(options) {
        if (!(this instanceof FSCache)) {
            return new FSCache(options);
        }
        var self = this,
            sets = {};

        requiredArgs.forEach(function (arg) {
            if (!options[arg.name]) {
                throw new Error(util.format('Missing Required Argument [%s]', arg.name));
            } else if (typeof options[arg.name] !== arg.type) {
                throw new Error(util.format('Invalid Argument Type Expected [%s] for [%s] but got [%s]', arg.type, arg.name, typeof options[arg.name]));
            }
            // If we've passed the checks, go ahead and set it in the current object.
            self[arg.name] = options[arg.name];
        });

        self.xfs = options.fs || fs;

        self.xfs = fsWishlist.mixin(self.xfs);

        self.xfs.mkdirp(self.path);

        self.readFileAsync = Promise.promisify(self.xfs.readFile);
        self.writeFileAsync = Promise.promisify(self.xfs.writeFile);
        self.unlinkAsync = Promise.promisify(self.xfs.unlink);
        self.readdirAsync = Promise.promisify(self.xfs.readdir);
        self.rmdirpAsync = Promise.promisify(self.xfs.rmdirp);

        this.getOrCreateSet = function getOrCreateSet(key) {
            if (FSCache.Set) {
                if (!(key in sets)) {
                    sets[key] = new Promise(function (resolve, reject) {
                        var setInstance = new FSCache.Set(key, self);
                        setInstance.on('destroy', function () {
                            delete sets[key];
                        });
                        setInstance.on('error', function (err) {
                            delete sets[key];
                            reject(err);
                        });
                        setInstance.on('ready', function () {
                            resolve(setInstance);
                        });
                    });
                }
                return sets[key];
            }
            var err = errors.errorCodes.SET_NOT_DEFINED;
            return Promise.reject(new errors.CacheError(err.name, err.message, err.code));
        };

    }

    inherit(FSCache, cacheInterface);

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
    FSCache.prototype.save = function (dataToBeCached, key, hashToReplace) {
        var self = this,
            urlEncodedKey = encodeURIComponent(key);

        return new Promise(function (resolve, reject) {
            // If we were sent a hash, we only want to update the cache if the hash matches what is currently stored.
            if (hashToReplace) {
                self.readFileAsync(path.join(self.path, urlEncodedKey)).then(function (data) {
                    var storedHash = getSHA1(data.toString());
                    // If we have mismatched hashes, something is out-of-sync send back a response so that the client can update.
                    if (storedHash !== hashToReplace) {
                        var err = errors.errorCodes.HASH_MISMATCH;
                        reject(new errors.CacheError(err.name, util.format(err.message, hashToReplace, storedHash), err.code));
                    } else {
                        // Otherwise hashes match, so go ahead and update the cache.
                        self.writeFileAsync(path.join(self.path, urlEncodedKey), dataToBeCached).then(function () {
                            resolve({
                                etag: getSHA1(dataToBeCached)
                            });
                        }, function (reason) {
                            var cacheErr = errors.errorCodes.UPDATE_FAILED;
                            reject(new errors.CacheError(cacheErr.name, util.format(cacheErr.message, key) + ' - ' + reason, cacheErr.code));
                        });
                    }
                }, function () {
                    // If we try to update a key that doesn't exist, update it anyways.
                    self.writeFileAsync(path.join(self.path, urlEncodedKey), dataToBeCached).then(function () {
                        resolve({
                            etag: getSHA1(dataToBeCached)
                        });
                    }, function (reason) {
                        var err = errors.errorCodes.UPDATE_FAILED;
                        reject(new errors.CacheError(err.name, util.format(err.message, key) + ' - ' + reason, err.code));
                    });
                });
            } else {
                // We didn't receive a previous hash, so update the cache blindly.
                self.writeFileAsync(path.join(self.path, urlEncodedKey), dataToBeCached).then(function () {
                    resolve({
                        etag: getSHA1(dataToBeCached)
                    });
                }, function (reason) {
                    var err = errors.errorCodes.UPDATE_FAILED;
                    reject(new errors.CacheError(err.name, util.format(err.message, key) + ' - ' + reason, err.code));
                });
            }
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
    FSCache.prototype.head = function (key) {
        return this.readFileAsync(path.join(this.path, encodeURIComponent(key))).then(function (data) {
            return {
                etag: getSHA1(data.toString())
            };
        }, function () {
            var err = errors.errorCodes.CACHE_NOT_FOUND;
            throw new errors.CacheError(err.name, util.format(err.message, key), err.code);
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
    FSCache.prototype.restore = function (key, ifNewerHash) {
        return this.readFileAsync(path.join(this.path, encodeURIComponent(key))).then(function (data) {
            data = data.toString();
            var storedHash = getSHA1(data);
            // If we were sent a hash, only return data if it doesn't match what is currently stored.
            if (ifNewerHash && ifNewerHash === storedHash) {
                return {
                    etag: storedHash
                };
            }
            return {
                etag: storedHash,
                body: data
            };
        }, function () {
            var err = errors.errorCodes.CACHE_NOT_FOUND;
            throw new errors.CacheError(err.name, util.format(err.message, key), err.code);
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
    FSCache.prototype.remove = function (key, hashToDelete) {
        var self = this,
            urlEncodedKey = encodeURIComponent(key);

        return new Promise(function (resolve, reject) {
            self.readFileAsync(path.join(self.path, urlEncodedKey)).then(function (data) {
                if (hashToDelete) {
                    var storedHash = getSHA1(data.toString());
                    // If we have mismatched hashes, something is out-of-sync send back a response so that the client can update.
                    if (storedHash !== hashToDelete) {
                        var err = errors.errorCodes.HASH_MISMATCH;
                        reject(new errors.CacheError(err.name, util.format(err.message, hashToDelete, storedHash), err.code));
                    } else {
                        // Otherwise hashes match, so go ahead and delete the cache.
                        self.unlinkAsync(path.join(self.path, urlEncodedKey)).then(function () {
                            resolve();
                        }, function (reason) {
                            var cacheError = errors.errorCodes.DELETE_FAILED;
                            reject(new errors.CacheError(cacheError.name, util.format(cacheError.message, key) + ' - ' +
                                reason, cacheError.code));
                        });
                    }
                } else {
                    // We didn't receive a previous hash, so delete the cache blindly.
                    self.unlinkAsync(path.join(self.path, urlEncodedKey)).then(function () {
                        resolve();
                    }, function (reason) {
                        var cacheError = errors.errorCodes.DELETE_FAILED;
                        reject(new errors.CacheError(cacheError.name, util.format(cacheError.message, key) + ' - ' +
                            reason, cacheError.code));
                    });
                }
            }, function () {
                var err = errors.errorCodes.CACHE_NOT_FOUND;
                reject(new errors.CacheError(err.name, util.format(err.message, key), err.code));
            });
        });
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
     * @returns {FSSet}
     */
    FSCache.prototype.set = function (setKey) {
        if (!setKey) {
            var err = new Error(util.format('Invalid Argument Type Expected [%s] for [%s] but got [%s]', 'string', 'setKey', typeof setKey));
            return Promise.reject(err);
        }
        return this.getOrCreateSet(setKey);
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
    FSCache.prototype.keys = function () {
        return this.readdirAsync(this.path).map(decodeURIComponent);
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
    FSCache.prototype.exists = function (key) {
        var self = this;
        return new Promise(function (resolve) {
            self.xfs.exists(path.join(self.path, encodeURIComponent(key)), function (exists) {
                resolve(exists);
            });
        });
    };

    /**
     * Removes all cached items from the set.
     * @returns {Promise}
     */
    FSCache.prototype.clear = function () {
        var self = this;
        return self.xfs.rmdirp(self.path)
            .then(function () {
                return self.xfs.mkdir(self.path);
            });
    };

    function getSHA1(data) {
        return crypto.createHash('sha1').update(data).digest('hex');
    }

    module.exports = FSCache;
} (module, require('../cacheInterface'), require('inherit-multiple'), require('util'), require('fs'), require('path'), require('bluebird'), require('crypto'), require('../errors'), require('fs-wishlist')));
