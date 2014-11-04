describe('GET request for collection', function() {

    beforeEach(function() {
        this.mockApp = new MockApp();
        this.k = requireKalamata()(this.mockApp);
    });

    describe('without any query params', function() {

        beforeEach(function() {
            var $this = this;
            this.mockCollectionJSON = ['one','two','three'];
            this.mockCollection = {
                toJSON: function() { return $this.mockCollectionJSON; }
            };
            this.mockModel = MockModel.get('items', {
                fetchAll: function() {
                    return new MockPromise([$this.mockCollection]);
                }
            });
            this.k.expose(this.mockModel);
            this.mockResponse = new MockResponse();
            spyOn(this.mockResponse, 'send');
            this.mockApp.getHandlers['/items'](
                new MockRequest(),
                this.mockResponse
            );
        });

        it('should instantiate a new model', function() {
            expect(this.mockModel.modelInstances.length).toEqual(1);
        });

        it('should respond with the result of the fetchAll promise', function() {
            expect(this.mockResponse.send.calls.argsFor(0)[0])
                    .toEqual(this.mockCollectionJSON);
        });

    });

    describe('when fetchAll throws an error', function() {

        beforeEach(function() {
            this.mockModel = MockModel.get('items', {
                fetchAll: function() {
                    return new MockFailPromise([new Error('mock error')]);
                }
            });
            this.k.expose(this.mockModel);
            this.mockResponse = new MockResponse();
            spyOn(this.mockResponse, 'send');
            try {
                this.mockApp.getHandlers['/items'](
                    new MockRequest(),
                    this.mockResponse
                );
            } catch(err) {
                this.error = err;
            }
        });

        it('should catch it and throw a \'Get Items failed\' error', function() {
            expect(this.error.message).toEqual('Get Items failed');
        });

        it('should set the inner error', function() {
            expect(this.error.inner).toBeDefined();
        });

    });

    describe('with the \'where\' query param', function() {

        describe('set to a valid JSON object', function() {

            beforeEach(function() {
                setupWhereQueryTests
                    .call(this, '{"firstname":"mike","lastname":"c"}');
            });

            it('should call \'where\' on the model and pass the parsed query value',
            function() {
                expect(this.w.firstname).toEqual('mike');
                expect(this.w.lastname).toEqual('c');
            });

        });

        describe('set to a JSON object without quotes around property names',
        function() {

            beforeEach(function() {
                setupWhereQueryTests.call(this, '{firstname:"mike",lastname:"c"}');
            });

            it('should call \'where\' on the model and pass the parsed query value',
            function() {
                expect(this.w.firstname).toEqual('mike');
                expect(this.w.lastname).toEqual('c');
            });

        });

        describe('set to an invalid JSON object', function() {

            beforeEach(function() {
                setupWhereQueryTests.call(this, '{firstname}');
            });

            it('should throw a \'Could not parse JSON\' error', function() {
                expect(this.error.message).toEqual('Could not parse JSON: {firstname}');
            });

            it('should set the inner error', function() {
                expect(this.error.inner.message).toEqual('Unexpected token f');
            });

        });

        function setupWhereQueryTests(whereQueryVal) {
            var $this = this;
            this.w = null;
            var mockModel = MockModel.get('items', {
                where: function(_w) {
                    $this.w = _w;
                    return {
                        fetchAll: function() {
                            return new MockPromise(['items']);
                        }
                    }
                }
            });
            this.k.expose(mockModel);
            this.mockResponse = new MockResponse();
            spyOn(this.mockResponse, 'send');
            try {
                this.mockApp.getHandlers['/items'](new MockRequest({
                    query: {
                        where: whereQueryVal
                    }
                }), this.mockResponse);
            } catch (err) {
                this.error = err;
            }
        }

    });

    describe('with a before hook', function() {

        describe('that runs without executing any code', function() {

            beforeEach(function() {
                setupHook.call(this, 'before', function() {});
            });

            it('should execute the hook with the correct arguments',
            function() {
                expect(this.hookFn).toHaveBeenCalled();
                expect(this.hookFn.calls.argsFor(0)[0]).toBe(this.mockReq);
                expect(this.hookFn.calls.argsFor(0)[1]).toBe(this.mockRes);
                expect(this.hookFn.calls.argsFor(0)[2])
                    .toBe(this.mockModel.modelInstances[0]);
            });

            it('should not throw and error', function() {
                expect(this.error).toBeUndefined();
            });

            it('should call fetchAll', function() {
                expect(this.mockFetchAll).toHaveBeenCalled();
            });

        });

        describe('that throws an error', function() {

            beforeEach(function() {
                setupHook.call(this, 'before', function() {
                    throw new Error('mock hook error');
                });
            });

            it('should throw an error', function() {
                expect(this.error).toBeDefined();
                expect(this.error.message).toEqual('mock hook error');
            });

            it('should set the inner error', function() {
                expect(this.error.inner).toBeDefined();
                expect(this.error.inner.message)
                    .toEqual(this.hookFnName + ' failed');
            });

            it('should not call fetchAll', function() {
                expect(this.mockFetchAll).not.toHaveBeenCalled();
            });

        });

        describe('that sends a response', function() {

            beforeEach(function() {
                setupHook.call(this, 'before', function(req, res) {
                    res.send(true);
                });
            });

            it('should not call fetchAll', function() {
                expect(this.mockFetchAll).not.toHaveBeenCalled();
            });

        });

        describe('that returns a promise', function() {

            beforeEach(function() {
                var mockPromise = this.mockPromise = new MockPromise();
                spyOn(this.mockPromise, 'then');
                setupHook.call(this, 'before', function(req, res) {
                    return mockPromise;
                });
            });

            it('should not call fetchAll', function() {
                expect(this.mockFetchAll).not.toHaveBeenCalled();
            });

            it('should execute the promise callback', function() {
                expect(this.mockPromise.then).toHaveBeenCalled()
            });

        });

    });

    describe('with an after hook', function() {

        describe('that runs without executing any code', function() {

            beforeEach(function() {
                setupHook.call(this, 'after', function() {});
            });

            it('should execute the hook with the correct arguments',
            function() {
                expect(this.hookFn).toHaveBeenCalled();
                expect(this.hookFn.calls.argsFor(0)[0]).toBe(this.mockReq);
                expect(this.hookFn.calls.argsFor(0)[1]).toBe(this.mockRes);
                expect(this.hookFn.calls.argsFor(0)[2])
                    .toBe(this.mockFetchAllResult);
            });

            it('should not throw and error', function() {
                expect(this.error).toBeUndefined();
            });

            it('should call fetchAll', function() {
                expect(this.mockFetchAll).toHaveBeenCalled();
            });

        });

        describe('that throws an error', function() {

            beforeEach(function() {
                setupHook.call(this, 'after', function() {
                    throw new Error('mock hook error');
                });
            });

            it('should throw an error', function() {
                expect(this.error).toBeDefined();
                expect(this.error.message).toEqual('mock hook error');
            });

            it('should set the inner error', function() {
                expect(this.error.inner).toBeDefined();
                expect(this.error.inner.message)
                    .toEqual(this.hookFnName + ' failed');
            });

        });

        describe('that sends a response', function() {

            beforeEach(function() {
                setupHook.call(this, 'after', function(req, res) {
                    res.send(true);
                });
            });

            it('should only attempt to send the response once', function() {
                expect(this.mockRes.send.calls.count()).toEqual(1);
                expect(this.mockRes.send.calls.argsFor(0)[0]).toEqual(true);
            });

        });

    });

    function setupHook(prefix, fn) {
        this.hookFn = fn;
        this.hookFnName = prefix + 'GetItems';
        var mockFetchAllResult =
                this.mockFetchAllResult =
                        ['one', 'two', 'three'];
        this.mockFetchAll = function() {
            return new MockPromise([mockFetchAllResult]);
        };
        spyOn(this, 'hookFn').and.callThrough();
        spyOn(this, 'mockFetchAll').and.callThrough();
        this.mockModel = MockModel.get('items', {
            fetchAll: this.mockFetchAll
        });
        this.k.expose(this.mockModel);
        this.k[this.hookFnName](this.hookFn);
        this.mockReq = new MockRequest();
        this.mockRes = new MockResponse();
        spyOn(this.mockRes, 'send').and.callThrough();
        try {
            this.mockApp.getHandlers['/items'](
                this.mockReq,
                this.mockRes
            );
        } catch(err) {
            this.error = err;
        }
    }

});