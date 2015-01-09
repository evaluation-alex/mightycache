(function (should, util, lib, errors) {
    describe('Memory Cache Implementation', function () {
        it('Should instantiate the test cache implementation', function () {
            var cache = lib.cache('mem',{});
            cache.constructor.name.should.be.exactly('TestCache');
        });
        it('Should be able to save a cached value', function (done) {
            var cache = lib.cache('mem',{});
            cache.save(JSON.stringify({ name: 'Zul' }), 'save-test').then(function (data) {
                try {
                    data.etag.should.be.exactly('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                    done();
                } catch (err) {
                    done(err);
                }
            }, function (reason) {
                done(reason);
            });
        });
        it('Should be able to save a cached value with a hash that doesn\'t exist', function (done) {
            var cache = lib.cache('mem',{});
            cache.save(JSON.stringify({ name: 'Zul' }), 'save-test-no-exist', '5bf48f033197ecd3635f459c145b0815').then(function (data) {
                try {
                    data.etag.should.be.exactly('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                    done();
                } catch (err) {
                    done(err);
                }
            }, function (reason) {
                done(reason);
            });
        });
        it('Should be able to update a cached value', function (done) {
            var cache = lib.cache('mem',{});
            cache.save(JSON.stringify({ name: 'Zul' }), 'update-test').then(function (data) {
                cache.save(JSON.stringify({ name: 'Odoyle Rules!' }), 'update-test', '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0').then(function (data) {
                    try {
                        data.etag.should.be.exactly('8d8dbf068de76b07ecd87c58f228c8dfdce138dd');
                        done();
                    } catch (err) {
                        done(err);
                    }
                }, function (reason) {
                    done(reason);
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Should be able to update a cached value that no longer exists', function (done) {
            var cache = lib.cache('mem',{});
            cache.save(JSON.stringify({ name: 'Zul' }), 'does-not-exist').then(function (data) {
                try {
                    data.etag.should.be.exactly('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                    done();
                } catch (err) {
                    done(err);
                }
            }, function (reason) {
                done(reason);
            });
        });
        it('Shouldn\'t be able to update a cached value when you have the wrong hash', function (done) {
            var cache = lib.cache('mem',{});
            cache.save(JSON.stringify({ name: 'Zul' }), 'update-test').then(function (data) {
                cache.save(JSON.stringify({ name: 'Odoyle Rules!' }), 'update-test', '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec01').then(function (data) {
                    done(new Error('This should have failed'));
                }, function (reason) {
                    try {
                        var errCode = errors.errorCodes.HASH_MISMATCH;
                        reason.code.should.be.exactly(errCode.code);
                        reason.message.should.be.exactly(util.format(errCode.message, '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec01', '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0'));
                        reason.name.should.be.exactly(errCode.name);
                        done();
                    } catch(err) {
                        done(err);
                    }
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Should be able to restore a cached value', function (done) {
            var cache = lib.cache('mem',{});
            cache.save(JSON.stringify({ name: 'Zul' }), 'restore-test').then(function (data) {
                cache.restore('restore-test').then(function (data) {
                    try {
                        data.etag.should.be.exactly('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                        data.body.should.be.exactly(JSON.stringify({ name: 'Zul' }));
                        done();
                    } catch (err) {
                        done(err);
                    }
                }, function (reason) {
                    done(reason);
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Shouldn\'t restore the same version', function (done) {
            var cache = lib.cache('mem',{});
            cache.save(JSON.stringify({ name: 'Zul' }), 'restore-test').then(function (data) {
                cache.restore('restore-test', '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0').then(function (data) {
                    try {
                        data.etag.should.be.exactly('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                        should.not.exist(data.body);
                        done();
                    } catch (err) {
                        done(err);
                    }
                }, function (reason) {
                    done(reason);
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Should restore if a different version exists', function (done) {
            var cache = lib.cache('mem',{});
            cache.save(JSON.stringify({ name: 'Zul' }), 'restore-test').then(function (data) {
                cache.restore('restore-test', 'test-hash').then(function (data) {
                    try {
                        data.etag.should.be.exactly('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                        data.body.should.be.exactly(JSON.stringify({ name: 'Zul' }));
                        done();
                    } catch (err) {
                        done(err);
                    }
                }, function (reason) {
                    done(reason);
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Shouldn\'t restore if a value doesn\'t exist', function (done) {
            var cache = lib.cache('mem',{});
            cache.restore('doesnt-exist').then(function (data) {
                done(new Error('Should Have Returned Error'));
            }, function (reason) {
                try {
                    reason.code.should.be.exactly(2);
                    reason.message.should.be.exactly('Cache for [doesnt-exist] not found');
                    reason.name.should.be.exactly('CacheNotFound');
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
        it('Should be able to remove a cached value', function (done) {
            var cache = lib.cache('mem',{});
            cache.save(JSON.stringify({ name: 'Zul' }), 'delete-test').then(function (data) {
                cache.remove('delete-test').then(function (data) {
                    done();
                }, function (reason) {
                    done(reason);
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Should be able to remove a cached value with a hash', function (done) {
            var cache = lib.cache('mem',{});
            cache.save(JSON.stringify({ name: 'Zul' }), 'delete-test').then(function (data) {
                cache.remove('delete-test', '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0').then(function (data) {
                    done();
                }, function (reason) {
                    done(reason);
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Shouldn\'t be able to remove a cached value with an incorrect hash', function (done) {
            var cache = lib.cache('mem',{});
            cache.save(JSON.stringify({ name: 'Zul' }), 'delete-test').then(function (data) {
                cache.remove('delete-test', 'incorrect-hash').then(function (data) {
                    done(new Error('Should Have Returned Error'));
                }, function (reason) {
                    try {
                        reason.code.should.be.exactly(0);
                        reason.message.should.be.exactly('Provided Hash [incorrect-hash] doesn\'t match current hash [4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0]');
                        reason.name.should.be.exactly('HashMismatch');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Shouldn\'t be able to remove a cached value that doesn\'t exist', function (done) {
            var cache = lib.cache('mem',{});
            cache.remove('delete-test-no-exist').then(function (data) {
                done(new Error('Should Have Returned Error'));
            }, function (reason) {
                try {
                    reason.code.should.be.exactly(2);
                    reason.message.should.be.exactly('Cache for [delete-test-no-exist] not found');
                    reason.name.should.be.exactly('CacheNotFound');
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });
}(require('should'), require('util'), require('../index'), require('../lib/errors')));