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
(function (module, cacheInterface, inherit, util, S3FS, Promise, errors) {
    var requiredArgs = [
        {
            name: 'bucket',
            type: 'string'
        }
    ];

    /**
     * Create an instance of the S3 cache implementation.
     *
     * @param options `Object`. **Required**. The options to use to create the S3 client
     * @property bucket `String`. **Required**. The bucket name
     * @property accessKeyId `String`. **Required**. The access key id to use to connect to S3
     * @property secretAccessKey `String`. **Required**. The secret access key to use to authenticate to S3
     * @returns {S3Cache} An implementation of the cache interface using Amazon S3 as the storage system
     * @constructor
     */
    function S3Cache(options) {
        if (!(this instanceof S3Cache)) {
            return new S3Cache(options);
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

        self.s3fs = new S3FS(
            self.bucket,
            {
                accessKeyId: options.accessKeyId,
                secretAccessKey: options.secretAccessKey
            }
        );
        this.getOrCreateSet = function getOrCreateSet(key) {
            if (S3Cache.Set) {
                if (!(key in sets)) {
                    sets[key] = new Promise(function (resolve, reject) {
                        var setInstance = new S3Cache.Set(key, self);
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

    inherit(S3Cache, cacheInterface);

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
    S3Cache.prototype.save = function (dataToBeCached, key, hashToReplace) {
        var self = this,
            urlEncodedKey = encodeURIComponent(key);
        return new Promise(function (resolve, reject) {
            // If we were sent a hash, we only want to update the cache if the hash matches what is currently stored.
            if (hashToReplace) {
                self.s3fs.headObject(urlEncodedKey).then(function (data) {
                    var storedHash = normalizeETag(data.ETag);
                    // If we have mismatched hashes, something is out-of-sync send back a response so that the client can update.
                    if (storedHash !== hashToReplace) {
                        var err = errors.errorCodes.HASH_MISMATCH;
                        reject(new errors.CacheError(err.name, util.format(err.message, hashToReplace, storedHash), err.code));
                    } else {
                        // Otherwise hashes match, so go ahead and update the cache.
                        self.s3fs.writeFile(urlEncodedKey, dataToBeCached).then(function (writtenData) {
                            resolve({
                                etag: normalizeETag(writtenData.ETag)
                            });
                        }, function (reason) {
                            var cacheError = errors.errorCodes.UPDATE_FAILED;
                            reject(new errors.CacheError(cacheError.name, util.format(cacheError.message, key) + ' - ' +
                                reason, cacheError.code));
                        });
                    }
                }, function () {
                    // If we try to update a key that doesn't exist, update it anyways.
                    self.s3fs.writeFile(urlEncodedKey, dataToBeCached).then(function (data) {
                        resolve({
                            etag: normalizeETag(data.ETag)
                        });
                    }, function (reason) {
                        var err = errors.errorCodes.UPDATE_FAILED;
                        reject(new errors.CacheError(err.name, util.format(err.message, key) + ' - ' + reason, err.code));
                    });
                });
            } else {
                // We didn't receive a previous hash, so update the cache blindly.
                self.s3fs.writeFile(urlEncodedKey, dataToBeCached).then(function (data) {
                    resolve({
                        etag: normalizeETag(data.ETag)
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
    S3Cache.prototype.head = function (key) {
        var self = this,
            urlEncodedKey = encodeURIComponent(key);

        return new Promise(function (resolve, reject) {
            self.s3fs.headObject(urlEncodedKey).then(function (data) {
                resolve({
                    etag: normalizeETag(data.ETag)
                });
            }, function () {
                var err = errors.errorCodes.CACHE_NOT_FOUND;
                reject(new errors.CacheError(err.name, util.format(err.message, key), err.code));
            });
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
    S3Cache.prototype.restore = function (key, ifNewerHash) {
        var self = this,
            urlEncodedKey = encodeURIComponent(key);

        return new Promise(function (resolve, reject) {
            self.s3fs.readFile(urlEncodedKey).then(function (data) {
                var storedHash = normalizeETag(data.ETag);
                // If we were sent a hash, only return data if it doesn't match what is currently stored.
                if (ifNewerHash && ifNewerHash === storedHash) {
                    resolve({
                        etag: storedHash
                    });
                } else {
                    resolve({
                        etag: storedHash,
                        body: data.Body.toString()
                    });
                }
            }, function () {
                var err = errors.errorCodes.CACHE_NOT_FOUND;
                reject(new errors.CacheError(err.name, util.format(err.message, key), err.code));
            });
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
    S3Cache.prototype.remove = function (key, hashToDelete) {
        var self = this,
            urlEncodedKey = encodeURIComponent(key);

        return new Promise(function (resolve, reject) {
            self.s3fs.headObject(urlEncodedKey).then(function (data) {
                if (hashToDelete) {
                    var storedHash = normalizeETag(data.ETag);
                    // If we have mismatched hashes, something is out-of-sync send back a response so that the client can update.
                    if (storedHash !== hashToDelete) {
                        var err = errors.errorCodes.HASH_MISMATCH;
                        reject(new errors.CacheError(err.name, util.format(err.message, hashToDelete, storedHash), err.code));
                    } else {
                        // Otherwise hashes match, so go ahead and delete the cache.
                        self.s3fs.unlink(urlEncodedKey).then(function () {
                            resolve();
                        }, function (reason) {
                            var cacheError = errors.errorCodes.DELETE_FAILED;
                            reject(new errors.CacheError(cacheError.name, util.format(cacheError.message, key) + ' - ' +
                                reason, cacheError.code));
                        });
                    }
                } else {
                    // We didn't receive a previous hash, so delete the cache blindly.
                    self.s3fs.unlink(urlEncodedKey).then(function () {
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
     * @returns {S3Set}
     */
    S3Cache.prototype.set = function (setKey) {
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
    S3Cache.prototype.keys = function () {
        return this.s3fs.readdir().then(function (files) {
            return files.map(decodeURIComponent);
        });
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
    S3Cache.prototype.exists = function (key) {
        var self = this,
            urlEncodedKey = encodeURIComponent(key);
        return new Promise(function (resolve) {
            self.s3fs.exists(urlEncodedKey, function (exists) {
                resolve(exists);
            });
        });
    };

    /**
     * Removes all cached items from the set.
     * @returns {Promise}
     */
    S3Cache.prototype.clear = function () {
        return this.s3fs.rmdirp('/');
    };

    /**
     * Converts the AWS SDK representation of ETags (`"HASH_VALUE"`) to our representation (`HASH_VALUE`).
     *
     * @param etag The ETag from the AWS SDK to normalize
     * @returns {string}
     */
    function normalizeETag(etag) {
        // The AWS SDK reports the ETag as ''HASH_VALUE'' for some reason, so account for that here by chopping off the quotes.
        return etag.slice(1, etag.length - 1);
    }

    module.exports = S3Cache;
}(module, require('../cacheInterface'), require('inherit-multiple'), require('util'), require('s3fs'), require('bluebird'), require('../errors')));
