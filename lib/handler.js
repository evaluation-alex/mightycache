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
(function (module, util, errors) {
    var checkHeader = 'if-none-match',
        requiredArgs = [
            {
                name: 'keyFunc',
                type: 'function'
            }
        ];

    function Handler(cacheImpl, options) {
        if (!(this instanceof Handler)) {
            return new Handler(cacheImpl, options);
        }

        requiredArgs.forEach(function (arg) {
            if (!options[arg.name]) {
                throw new Error(util.format('Missing Required Argument [%s]', arg.name));
            } else if (arg.type && typeof options[arg.name] !== arg.type) {
                throw new Error(util.format('Invalid Argument Type Expected [%s] for [%s] but got [%s]', arg.type, arg.name, typeof options[arg.name]));
            }
        });

        checkHeader = options.checkHeader || checkHeader;

        return {
            head: function (req, res) {
                var key = options.keyFunc(req),
                    ifNewerHash = req.headers[checkHeader];
                cacheImpl.head(key).then(function (data) {
                    res.header('etag', data.etag);
                    if (data.etag !== ifNewerHash) {
                        res.status(200).end();
                    } else {
                        res.status(304).end();
                    }
                }, function (reason) {
                    if (reason) {
                        if (reason.code === errors.errorCodes.CACHE_NOT_FOUND.code) {
                            res.status(404).send(reason.message);
                        } else {
                            res.status(500).send(reason.message);
                        }
                    } else {
                        res.status(500).send('An Unknown Error Occurred');
                    }
                });
            },
            save: function (req, res) {
                var dataToBeCached = JSON.stringify(req.body),
                    key = options.keyFunc(req),
                    hashToReplace = req.headers[checkHeader];
                cacheImpl.save(dataToBeCached, key, hashToReplace).then(function (data) {
                    res.header('etag', data.etag);
                    res.status(200).send();
                }, function (reason) {
                    if (reason) {
                        if (reason.code === errors.errorCodes.HASH_MISMATCH.code) {
                            res.status(412).send(reason.message);
                        } else if (reason.code === errors.errorCodes.UPDATE_FAILED.code) {
                            res.status(500).send(reason.message);
                        } else if (reason.code === errors.errorCodes.CACHE_NOT_FOUND.code) {
                            res.status(404).send(reason.message);
                        } else {
                            res.status(500).send(reason.message);
                        }
                    } else {
                        res.status(500).send('An Unknown Error Occurred');
                    }
                });
            },
            restore: function (req, res) {
                var key = options.keyFunc(req),
                    ifNewerHash = req.headers[checkHeader];
                cacheImpl.restore(key, ifNewerHash).then(function (data) {
                    res.header('etag', data.etag);
                    if (data.body) {
                        res.status(200).send(data.body);
                    } else {
                        res.status(304).send();
                    }
                }, function (reason) {
                    if (reason) {
                        if (reason.code === errors.errorCodes.CACHE_NOT_FOUND.code) {
                            res.status(404).send(reason.message);
                        } else {
                            res.status(500).send(reason.message);
                        }
                    } else {
                        res.status(500).send('An Unknown Error Occurred');
                    }
                });
            },
            remove: function (req, res) {
                var key = options.keyFunc(req),
                    hashToDelete = req.headers[checkHeader];
                cacheImpl.remove(key, hashToDelete).then(function () {
                    res.status(204).send();
                }, function (reason) {
                    if (reason) {
                        if (reason.code === errors.errorCodes.HASH_MISMATCH.code) {
                            res.status(412).send(reason.message);
                        } else if (reason.code === errors.errorCodes.DELETE_FAILED.code) {
                            res.status(500).send(reason.message);
                        } else if (reason.code === errors.errorCodes.CACHE_NOT_FOUND.code) {
                            res.status(404).send(reason.message);
                        } else {
                            res.status(500).send(reason.message);
                        }
                    } else {
                        res.status(500).send('An Unknown Error Occurred');
                    }
                });
            }
        };
    }

    module.exports = Handler;
}(module, require('util'), require('./errors')));