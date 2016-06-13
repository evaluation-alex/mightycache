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
(function (module, util, handler, cacheInterface, setInterface) {
    module.exports.cacheInterface = cacheInterface;
    module.exports.setInterface = setInterface;

    module.exports.handler = function Handler(cacheImpl, options) {
        if (!cacheImpl) {
            throw new Error('A Cache Implementation is required');
        }

        if (!options || typeof options !== 'object') {
            throw new Error('Options is required and must be an object');
        }

        return handler(cacheImpl, options);
    };

    module.exports.cache = function Cache(impl, options) {
        if (!impl || typeof impl !== 'string') {
            throw new Error('Impl is required and must be a string');
        }

        if (!options || typeof options !== 'object') {
            throw new Error('Options is required and must be an object');
        }

        impl = impl.toLowerCase();

        var cacheModule = './lib/cacheImpl/' + impl,
            setModule = './lib/setImpl/' + impl,
            setClass,
            cacheClass;

        try {
            setClass = require(setModule);
        }
        catch (err) {
            console.warn('Unable to load Set class for Implementation [%s]. Set Functionality is not required but is recommended.', impl, err); // eslint-disable-line no-console
        }

        try {
            cacheClass = require(cacheModule);
            if (setClass) {
                cacheClass.Set = setClass;
            }
        }
        catch (err) {
            if (err && err.code === 'MODULE_NOT_FOUND' && err.message === 'Cannot find module \'' + cacheModule + '\'') {
                throw new Error(util.format('Implementation [%s] does not exist', impl));
            }
            throw err;
        }

        return cacheClass(options);
    };
}(module, require('util'), require('./lib/handler'), require('./lib/cacheInterface'), require('./lib/setInterface')));