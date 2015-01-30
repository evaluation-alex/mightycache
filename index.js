(function (module, util, handler, cacheInterface) {
    'use strict';
    module.exports.cacheInterface = cacheInterface;

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

        var modulePath = './lib/impl/' + impl;

        try {
            return require(modulePath)(options);
        } catch (err) {
            if (err && err.code === 'MODULE_NOT_FOUND' && err.message === 'Cannot find module \'' + modulePath + '\'') {
                throw new Error(util.format('Implementation [%s] does not exist', impl));
            }
            throw err;
        }
    };
}(module, require('util'), require('./lib/handler'), require('./lib/cacheInterface')));