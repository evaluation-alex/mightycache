# Mighty Cache
[![npm](https://img.shields.io/npm/v/mightycache.svg)]()
[![npm](https://img.shields.io/npm/dm/mightycache.svg)]()
[![Build Status](https://travis-ci.org/RiptideCloud/mightycache.svg?branch=master)](https://travis-ci.org/RiptideCloud/mightycache)
[![Coverage Status](https://img.shields.io/coveralls/RiptideCloud/mightycache.svg)](https://coveralls.io/r/RiptideCloud/mightycache)
[![Codacy](https://img.shields.io/codacy/e15e6fda7ab3418e8d5573ad32f97a8b.svg)](https://www.codacy.com/public/davidtpate/mightycache)
[![Code Climate](https://codeclimate.com/github/RiptideCloud/mightycache/badges/gpa.svg)](https://codeclimate.com/github/RiptideCloud/mightycache)
[![David](https://img.shields.io/david/RiptideCloud/mightycache.svg)]()
[![David](https://img.shields.io/david/dev/RiptideCloud/mightycache.svg)]()
[![David](https://img.shields.io/david/peer/RiptideCloud/mightycache.svg)]()

Module providing multiple implementations of a cache backed by a data store.

## Purpose
Mighty Cache is meant to provide an easy to use interface for caching backed by any number of data stores through 
implementations.

## Structure
This section describes the overall structure of the code within the service.

### Tests
The test directory contains multiple sets of tests which are meant to test multiple implementations for data stores.
The tests use [supertest](https://github.com/tj/supertest) to send actual requests to the server and ensure that our
interfaces and implementations are working as expected and responding correctly.

## Full Example With Express
A custom cache implementation can be used if needed, it should just use the same interface as described in the [Cache Implementation](#cache-implementation) section.

```js
var express = require('express');
var app = express();
var mightyCache = require('mightycache');
var cacheImpl = mightyCache.cache('redis',
    {
        host: 'localhost',
        port: 6379,
        options: {}
    }
);
var handler = mightyCache.handler(cacheImpl, {
  keyFunc: function generateKey(req) {
    return req.user.username + '-cache.json';
  }
});

app.route('/cache/:username')
   .get(handler.restore)
   .post(handler.save)
   .delete(handler.remove);

app.listen();
```

## Interface

This section describes the interface to be used when communicating with Mighty Cache.

### Instantiation
Create an instance of a given cache implementation.

```js
var mightyCache = require('mightycache');
var cache = mightyCache.cache(cacheImpl, options);
```

#### Parameters
Name | Type | Description
---------|--------|----------------
`cacheImpl`|`string`|**Required**. The name of the cache implementation to use.
`options`|`object`|**Required**. The options to be used to instantiate the cache implementation.

### Create a Handler
Create an instance of a handler for web service requests.

```js
var mightyCache = require('mightycache');
var handler = mightyCache.handler(cacheImpl, options);
```

#### Parameters

Name | Type | Description
---------|--------|----------------
`cacheImpl`|`object`|**Required**. The cache implementation to be used by the handler. Must implement all required methods from the [cache interface](./lib/cacheInterface.js).
`options`|`object`|**Required**. The options to be used to instantiate the handler.
`options.keyFunc`|`function`|**Required**. Function to be used to generate a key to be used as the `name` for operations on cached data.

The `options.keyFunc` option is called with each request with the Express [request](http://expressjs.com/api#request) object.
The request object can be optionally used and it should return a string.

##### Example Key Function
```js
function generateKey(req) {
    return req.user.username + '-cache.json';
}
```

## Implementations

Below is the list of current implementations supported and details about their required options and how to instantiate them.

### Redis

The Redis implementation uses the [redis](https://www.npmjs.com/package/redis) module to establish a connection to Redis.

```js
var mightyCache = require('mightycache');
var cache = mightyCache.cache('redis',
    {
        host: 'localhost',
        port: 6379,
        options: {}
    }
);
```

#### Parameters
Name | Type | Description
---------|--------|----------------
`host`|`string`|**Required**. The host to connect to establish a connection to Redis.
`port`|`number`|**Required**. The port to connect to establish a connection to Redis.
`options`|`object`|**Required**. Options object used to create a Redis client, see [redis.createClient()](https://github.com/mranney/node_redis#rediscreateclient) for available options.

### S3
The S3 implementation uses the [module](https://www.npmjs.com/package/s3fs) module to establish a connection to Amazon S3.

```js
var mightyCache = require('mightycache');
var cache = mightyCache.cache('s3',
    {
        bucket: 'test-bucket',
        accessKeyId: 'Access Key Id Goes Here',
        secretAccessKey: 'Secret Access Key Goes Here'
    }
);
```

#### Parameters
Name | Type | Description
---------|--------|----------------
`bucket`|`string`|**Required**. Bucket to be used to store cache data in. This can include both the bucket and a path. (Ex. `test-bucket/cache/data`)
`accessKeyId`|`string`|**Required**. Access Key Id to be used to connect to S3.
`secretAccessKey`|`string`|**Required**. Secret Access Key corresponding to the provided Access Key Id to allow authentication to access S3.

### Memory
The in-memory implementation which is meant for testing purposes only as it is not mature, therefore it is **not production ready**
and it is not expected to ever be production ready.

```js
var mightyCache = require('mightycache');
var cache = mightyCache.cache('mem',{});
```

#### Parameters
As this is meant solely for testing purposes it currently has no required parameters.

## Cache Implementation
Every implementation **must** implement the following methods:

### restore(key, [ifNewerHash])
Restores the cached data for the provided key.

* key `String`. **Required**. Identifies the data being retrieved
* ifNewerHash `String`. _Optional_. If provided only retrieves the cached data if the hashes do not match, otherwise it just retrieves everything

```js
var cache = mightyCache.cache(cacheImplName, options);
cache.restore('test-key').then(function(data) {
  // Data successfully retrieved, `data.etag` has the hash of it and `data.body` has the data that was cached
}, function(reason) {
  // Something went wrong
});
```

### save(dataToBeCached, key, [hashToReplace])
Stores the data for the provided key.

* dataToBeCached `String`. **Required**. The data to be stored
* key `String`. **Required**. Identifies the data being stored, used later to retrieve, update, or restore the cache
* hashToReplace `String` _Optional_ If provided, only updates the cache when the hash value provided is the same as what is currently stored. If there isn't a cache currently created it will persist the data regardless.

```js
var cache = mightyCache.cache(cacheImplName, options);
cache.save('Test Data', 'test-key').then(function(data) {
  // Data successfully stored `data.etag` has the etag that was generated
}, function(reason) {
  // Something went wrong
});
```

### remove(key, [hashToDelete])
Deletes the cached data for the provided key.

* key `String`. **Required**. Identifies the data being deleted
* hashToDelete `String`. _Optional_. If provided only deletes the cache if the hashes match, otherwise it just deletes the cache

```js
var cache = mightyCache.cache(cacheImplName, options);
cache.remove('test-key').then(function() {
  // Cache successfully deleted
}, function(reason) {
  // Something went wrong
});
```

## Testing
This repository uses [Mocha](http://mochajs.org/) as its test runner. Tests can be run by executing the following command:

```bash
npm test
```

This will run all tests and report on their success/failure in the console, additionally it will include our [Code Coverage](#code-coverage).

## Code Coverage
This repository uses [Istanbul](http://gotwarlost.github.io/istanbul/) as its code coverage tool. Code Coverage can be calculated by executing the following command:

```bash
npm test
```

This will report the Code Coverage to the console similar to the following:

```bash
=============================== Coverage summary ===============================
Statements   : 78.07% ( 356/456 )
Branches     : 50.23% ( 107/213 )
Functions    : 74.77% ( 83/111 )
Lines        : 78.07% ( 356/456 )
================================================================================
```

Additionally, an interactive HTML report will be generated in `./coverage/lcov-report/index.html` which allows browsing the coverage by file.

## Code Style
This repository uses [JSHint](https://github.com/jshint/jshint) for static analysis, [JavaScript Code Style](https://github.com/jscs-dev/node-jscs)
for validating code style, [JSInspect](https://github.com/danielstjules/jsinspect) to detect code duplication, [Buddy.js](https://github.com/danielstjules/buddy.js)
to detect the use of [Magic Numbers](http://en.wikipedia.org/wiki/Magic_number_(programming)),
and [Node Security Project](https://github.com/nodesecurity/nsp) for detecting potential security threats with our dependencies.

To run the code quality tools above, simply execute the following command:

```bash
npm run-script inspect
```

This will create files with the results in the `reports` directory. The only exception is `NSP` which only outputs to the console that it is run in right now.

## License
[MIT](LICENSE)

## Copyright
> Copyright (c) 2014 Riptide Software Inc.
