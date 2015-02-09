(function(module, util, handler, cacheInterface, setInterface) {
    'use strict';
    module.exports.cacheInterface = cacheInterface;
    module.exports.setInterface = setInterface;

    module.exports.handler = function Handler (cacheImpl, options) {
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

        var cacheModule = './lib/cacheImpl/' + impl;
        var setModule = './lib/setImpl/' + impl;
        var setClass;
        var cacheClass;

        try{
            setClass = require(setModule);
        }
        catch (err){
            console.warn('Implementation [%s] does not provide a set class. Set Functionality is not required but is recommended', impl);
        }

        try {
            cacheClass = require(cacheModule);
            if(setClass){
                cacheClass.Set = setClass;
            }
        } catch (err) {
            if (err && err.code === 'MODULE_NOT_FOUND' && err.message === 'Cannot find module \'' + cacheModule + '\'') {
                throw new Error(util.format('Implementation [%s] does not exist', impl));
            }
            throw err;
        }

        return cacheClass(options);
    };
}(module, require('util'), require('./lib/handler'), require('./lib/cacheInterface'), require('./lib/setInterface')));