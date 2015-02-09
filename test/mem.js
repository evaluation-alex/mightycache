(function (should, expect, util, lib, errors) {
    describe('Memory Cache Implementation', function () {
        it('Should instantiate the test cache implementation', function () {
            var cache = lib.cache('mem', {});
            expect(cache).to.be.ok();
        });
        it('Should be able to save a cached value', function (done) {
            cache.save(JSON.stringify({name: 'Zul'}), 'save-test').then(function (data) {
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
            cache.save(JSON.stringify({name: 'Zul'}), 'save-test-no-exist', '5bf48f033197ecd3635f459c145b0815').then(function (data) {
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
            cache.save(JSON.stringify({name: 'Zul'}), 'update-test').then(function (data) {
                cache.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0').then(function (data) {
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
            cache.save(JSON.stringify({name: 'Zul'}), 'does-not-exist').then(function (data) {
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
            cache.save(JSON.stringify({name: 'Zul'}), 'update-test').then(function (data) {
                cache.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec01').then(function (data) {
                    done(new Error('This should have failed'));
                }, function (reason) {
                    try {
                        var errCode = errors.errorCodes.HASH_MISMATCH;
                        reason.code.should.be.exactly(errCode.code);
                        reason.message.should.be.exactly(util.format(errCode.message, '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec01', '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0'));
                        reason.name.should.be.exactly(errCode.name);
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            }, function (reason) {
                done(reason);
            });
        });
        it('Should be able to restore a cached value', function (done) {
            cache.save(JSON.stringify({name: 'Zul'}), 'restore-test').then(function (data) {
                cache.restore('restore-test').then(function (data) {
                    try {
                        data.etag.should.be.exactly('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                        data.body.should.be.exactly(JSON.stringify({name: 'Zul'}));
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
            cache.save(JSON.stringify({name: 'Zul'}), 'restore-test').then(function (data) {
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
            cache.save(JSON.stringify({name: 'Zul'}), 'restore-test').then(function (data) {
                cache.restore('restore-test', 'test-hash').then(function (data) {
                    try {
                        data.etag.should.be.exactly('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                        data.body.should.be.exactly(JSON.stringify({name: 'Zul'}));
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
            cache.save(JSON.stringify({name: 'Zul'}), 'delete-test').then(function (data) {
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

            cache.save(JSON.stringify({name: 'Zul'}), 'delete-test').then(function (data) {
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
            cache.save(JSON.stringify({name: 'Zul'}), 'delete-test').then(function (data) {
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
        it('Should get a list of all the keys', function (done) {
            q.all([cache.save({}, 'key1'), cache.save({}, 'key2')]).then(function () {
                cache.keys().then(function (keys) {
                    try {
                        keys.should.be.instanceof(Array).and.have.lengthOf(2);
                        keys.should.eql(['key1', 'key2']);

                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });
        });
        /**
         * Test for Set
         */

        it('Should create a set and exist in the list of keys', function (done) {
            cache.set('mySet').then(function (mySet) {
                try {
                    should.exist(mySet);
                    cache.keys().then(function (keys) {
                        try {
                            keys.should.be.instanceof(Array).and.have.lengthOf(1);
                            keys.should.eql(['mySet']);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                } catch (err) {
                    done(err);
                }
            });
        });

        it('Should destroy a created set and remove it from the key', function (done) {
            cache.set('mySet').then(function (mySet) {
                try {
                    should.exist(mySet);
                    cache.keys().then(function (keys) {
                        try {
                            keys.should.be.instanceof(Array).and.have.lengthOf(1);
                            keys.should.eql(['mySet']);
                            mySet.destroy().then(function () {
                                cache.keys().then(function (keys) {
                                    try {
                                        keys.should.be.instanceof(Array).and.have.lengthOf(1);
                                        keys.should.eql([]);
                                        done();
                                    } catch (err) {
                                        done();
                                    }
                                });
                            });
                        } catch (err) {
                            done(err);
                        }
                    });
                } catch (err) {
                    done(err);
                }
            });
        });

        describe("test set", function () {
            var set;

            beforeEach(function (done) {
                var cache = lib.cache('mem', {});
                cache.set('mySet').then(function (mySet) {
                    set = mySet;
                    done();
                }, done);
            });

            it('Should instantiate the test set implementation', function () {
                set.constructor.name.should.be.exactly('MemSet');
            });
            it('Should be able to save a cached value', function (done) {
                set.save(JSON.stringify({name: 'Zul'}), 'save-test').then(function (data) {
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
                set.save(JSON.stringify({name: 'Zul'}), 'save-test-no-exist', '5bf48f033197ecd3635f459c145b0815').then(function (data) {
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
                set.save(JSON.stringify({name: 'Zul'}), 'update-test').then(function (data) {
                    set.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0').then(function (data) {
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
                set.save(JSON.stringify({name: 'Zul'}), 'does-not-exist').then(function (data) {
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
                set.save(JSON.stringify({name: 'Zul'}), 'update-test').then(function (data) {
                    set.save(JSON.stringify({name: 'Odoyle Rules!'}), 'update-test', '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec01').then(function (data) {
                        done(new Error('This should have failed'));
                    }, function (reason) {
                        try {
                            var errCode = errors.errorCodes.HASH_MISMATCH;
                            reason.code.should.be.exactly(errCode.code);
                            reason.message.should.be.exactly(util.format(errCode.message, '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec01', '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0'));
                            reason.name.should.be.exactly(errCode.name);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                }, function (reason) {
                    done(reason);
                });
            });
            it('Should be able to restore a cached value', function (done) {
                set.save(JSON.stringify({name: 'Zul'}), 'restore-test').then(function (data) {
                    set.restore('restore-test').then(function (data) {
                        try {
                            data.etag.should.be.exactly('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                            data.body.should.be.exactly(JSON.stringify({name: 'Zul'}));
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
                set.save(JSON.stringify({name: 'Zul'}), 'restore-test').then(function (data) {
                    set.restore('restore-test', '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0').then(function (data) {
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
                set.save(JSON.stringify({name: 'Zul'}), 'restore-test').then(function (data) {
                    set.restore('restore-test', 'test-hash').then(function (data) {
                        try {
                            data.etag.should.be.exactly('4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0');
                            data.body.should.be.exactly(JSON.stringify({name: 'Zul'}));
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
                set.restore('doesnt-exist').then(function (data) {
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
                set.save(JSON.stringify({name: 'Zul'}), 'delete-test').then(function (data) {
                    set.remove('delete-test').then(function (data) {
                        done();
                    }, function (reason) {
                        done(reason);
                    });
                }, function (reason) {
                    done(reason);
                });
            });
            it('Should be able to remove a cached value with a hash', function (done) {

                set.save(JSON.stringify({name: 'Zul'}), 'delete-test').then(function (data) {
                    set.remove('delete-test', '4cdbc5ffe38a19ec2fd3c1625f92c14e2e0b4ec0').then(function (data) {
                        done();
                    }, function (reason) {
                        done(reason);
                    });
                }, function (reason) {
                    done(reason);
                });
            });
            it('Shouldn\'t be able to remove a cached value with an incorrect hash', function (done) {
                set.save(JSON.stringify({name: 'Zul'}), 'delete-test').then(function (data) {
                    set.remove('delete-test', 'incorrect-hash').then(function (data) {
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
                set.remove('delete-test-no-exist').then(function (data) {
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
            it('Should get a list of all the keys', function (done) {
                q.all([set.save({}, 'key1'), set.save({}, 'key2')]).then(function () {
                    set.keys().then(function (keys) {
                        try {
                            keys.should.be.instanceof(Array).and.have.lengthOf(2);
                            keys.should.eql(['key1', 'key2']);

                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                });
            });


        });


    });
}(require('should'), require('./helper').getExpect(), require('util'), require('../index'), require('../lib/errors')));