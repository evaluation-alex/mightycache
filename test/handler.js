(function (expect, lib, CacheInterface) {
    'use strict';
    describe('Handler Implementation', function () {
        it('Shouldn\'t be able to instantiate the a handler without a handler', function () {
            expect(function () {
                lib.handler();
            }).to.throw(Error, 'A Cache Implementation is required');
        });
        it('Shouldn\'t be able to instantiate a handler without options', function () {
            expect(function () {
                lib.handler({});
            }).to.throw(Error, 'Options is required and must be an object');
        });
        it('Shouldn\'t be able to instantiate a handler with an invalid handler', function () {
            expect(function () {
                lib.handler(new CacheInterface(), {});
            }).to.throw(Error, 'Missing Required Argument [keyFunc]');
        });
        it('Shouldn\'t be able to instantiate the handler without a key function', function () {
            expect(function () {
                lib.handler(new CacheInterface(), {});
            }).to.throw(Error, 'Missing Required Argument [keyFunc]');
        });
        it('Shouldn\'t be able to instantiate the handler with an invalid key function', function () {
            expect(function () {
                lib.handler(new CacheInterface(),
                    {
                        keyFunc: 'test'
                    }
                );
            }).to.throw(Error, 'Invalid Argument Type Expected [function] for [keyFunc] but got [string]');
        });
        it('Should instantiate the Memory handler', function () {
            var cache = lib.handler(lib.cache('mem', {}),
                {
                    keyFunc: function () {
                        return 'test';
                    }
                }
            );
            expect(cache).to.be.ok();
        });
        it('Should be able to instantiate the Redis handler', function () {
            var cache = lib.handler(lib.cache('redis', {
                    host: 'localhost',
                    port: 6379,
                    options: {}
                }),
                {
                    keyFunc: function () {
                        return 'test';
                    }
                }
            );
            expect(cache).to.be.ok();
        });
        it('Should be able to instantiate the S3 handler', function () {
            var cache = lib.handler(lib.cache('s3', {
                    bucket: 'test',
                    accessKeyId: 'test',
                    secretAccessKey: 'test'
                }),
                {
                    keyFunc: function () {
                        return 'test';
                    }
                }
            );
            expect(cache).to.be.ok();
        });
        it('Should be able to save a cached value', function (done) {
            var cache = lib.handler(lib.cache('mem', {}),
                {
                    keyFunc: function () {
                        return 'test';
                    }
                }
            );
            cache.save(
                {
                    body: {
                        name: 'Zul'
                    },
                    headers: {}
                },
                new MockResponse(function (res) {
                    try {

                        expect(res.headers.etag).to.equal('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                        expect(res.statusCode).to.equal(200);
                        done();
                    } catch (err) {
                        done(err);
                    }
                })
            );
        });
        it('Should be able to save a cached value with a hash that doesn\'t exist', function (done) {
            var cache = lib.handler(lib.cache('mem', {}),
                {
                    keyFunc: function () {
                        return 'test';
                    }
                }
            );
            cache.save(
                {
                    body: {
                        name: 'Zul'
                    },
                    headers: {
                        'if-none-match': '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0'
                    }
                },
                new MockResponse(function (res) {
                    try {
                        expect(res.headers.etag).to.equal('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                        expect(res.statusCode).to.equal(200);
                        done();
                    } catch (err) {
                        done(err);
                    }
                })
            );
        });
        it('Should be able to update a cached value', function (done) {
            var cache = lib.handler(lib.cache('mem', {}),
                {
                    keyFunc: function () {
                        return 'test';
                    }
                }
            );
            cache.save(
                {
                    body: {
                        name: 'Zul'
                    },
                    headers: {}
                },
                new MockResponse(function () {
                    cache.save(
                        {
                            body: {
                                name: 'Odoyle Rules!'
                            },
                            headers: {
                                'if-none-match': '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0'
                            }
                        },
                        new MockResponse(function (res) {
                            try {
                                expect(res.headers.etag).to.equal('8d8dbf068de76b07ecd87c58f228c8dfdce138dd');
                                expect(res.statusCode).to.equal(200);
                                done();
                            } catch (err) {
                                done(err);
                            }
                        })
                    );
                })
            );
        });
        it('Should be able to update a cached value that no longer exists', function (done) {
            var cache = lib.handler(lib.cache('mem', {}),
                {
                    keyFunc: function () {
                        return 'test';
                    }
                }
            );
            cache.save(
                {
                    body: {
                        name: 'Zul'
                    },
                    headers: {}
                },
                new MockResponse(function (res) {
                    try {
                        expect(res.headers.etag).to.equal('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                        expect(res.statusCode).to.equal(200);
                        done();
                    } catch (err) {
                        done(err);
                    }
                })
            );
        });
        it('Should be able to restore a cached value', function (done) {
            var cache = lib.handler(lib.cache('mem', {}),
                {
                    keyFunc: function () {
                        return 'test';
                    }
                }
            );
            cache.save(
                {
                    body: {
                        name: 'Zul'
                    },
                    headers: {}
                },
                new MockResponse(function () {
                    cache.restore({headers: {}}, new MockResponse(function (res) {
                        try {
                            expect(res.headers.etag).to.equal('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                            expect(res.statusCode).to.equal(200);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }));
                })
            );
        });
        it('Shouldn\'t restore the same version', function (done) {
            var cache = lib.handler(lib.cache('mem', {}),
                {
                    keyFunc: function () {
                        return 'test';
                    }
                }
            );
            cache.save(
                {
                    body: {
                        name: 'Zul'
                    },
                    headers: {}
                },
                new MockResponse(function () {
                    cache.restore({headers: {'if-none-match': '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0'}}, new MockResponse(function (res) {
                        try {
                            expect(res.headers.etag).to.equal('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                            expect(res.statusCode).to.equal(304);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }));
                })
            );
        });
        it('Should restore if a different version exists', function (done) {
            var cache = lib.handler(lib.cache('mem', {}),
                {
                    keyFunc: function () {
                        return 'test';
                    }
                }
            );
            cache.save(
                {
                    body: {
                        name: 'Zul'
                    },
                    headers: {}
                },
                new MockResponse(function () {
                    cache.restore({headers: {'if-none-match': 'test-hash'}}, new MockResponse(function (res) {
                        try {
                            expect(res.headers.etag).to.equal('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                            expect(res.statusCode).to.equal(200);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }));
                })
            );
        });
        it('Shouldn\'t restore if a value doesn\'t exist', function (done) {
            var cache = lib.handler(lib.cache('mem', {}),
                {
                    keyFunc: function () {
                        return 'test-restore-no-exist';
                    }
                }
            );
            cache.restore({headers: {'if-none-match': 'test-hash'}}, new MockResponse(function (res) {
                try {
                    expect(res.body).to.equal('Cache for [test-restore-no-exist] not found');
                    expect(res.statusCode).to.equal(404);
                    done();
                } catch (err) {
                    done(err);
                }
            }));
        });
        it('Should be able to remove a cached value', function (done) {
            var cache = lib.handler(lib.cache('mem', {}),
                {
                    keyFunc: function () {
                        return 'test';
                    }
                }
            );
            cache.save(
                {
                    body: {
                        name: 'Zul'
                    },
                    headers: {}
                },
                new MockResponse(function () {
                    cache.remove({headers: {}}, new MockResponse(function (res) {
                        try {
                            expect(res.statusCode).to.equal(204);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }));
                })
            );
        });
        it('Should be able to remove a cached value with a hash', function (done) {
            var cache = lib.handler(lib.cache('mem', {}),
                {
                    keyFunc: function () {
                        return 'test';
                    }
                }
            );
            cache.save(
                {
                    body: {
                        name: 'Zul'
                    },
                    headers: {}
                },
                new MockResponse(function () {
                    cache.remove({headers: {'if-none-match': '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0'}}, new MockResponse(function (res) {
                        try {
                            expect(res.statusCode).to.equal(204);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }));
                })
            );
        });
        it('Shouldn\'t be able to remove a cached value with an incorrect hash', function (done) {
            var cache = lib.handler(lib.cache('mem', {}),
                {
                    keyFunc: function () {
                        return 'test';
                    }
                }
            );
            cache.save(
                {
                    body: {
                        name: 'Zul'
                    },
                    headers: {}
                },
                new MockResponse(function () {
                    cache.remove({headers: {'if-none-match': 'incorrect-hash'}}, new MockResponse(function (res) {
                        try {
                            expect(res.body).to.equal('Provided Hash [incorrect-hash] doesn\'t match current hash [4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0]');
                            expect(res.statusCode).to.equal(412);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }));
                })
            );
        });
    });

    function MockResponse(cb) {
        if (!(this instanceof MockResponse)) {
            return new MockResponse(cb);
        }

        this.headers = {};

        this.header = function (name, value) {
            this.headers[name] = value;
            return this;
        };
        this.status = function (value) {
            this.statusCode = value;
            return this;
        };
        this.send = function (value) {
            this.body = value;
            cb(this);
        };
    }
}(require('./helper').getExpect(), require('../index'), require('../lib/cacheInterface')));