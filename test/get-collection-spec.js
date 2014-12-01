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
            var $this = this;
            this.mockErr = new Error('mock error');
            this.mockModel = MockModel.get('items', {
                fetchAll: function() {
                    return new MockFailPromise($this.mockErr);
                }
            });
            this.k.expose(this.mockModel);
            this.mockNextFn = function() {};
            spyOn(this, 'mockNextFn');
            this.mockApp.getHandlers['/items'](
                new MockRequest(),
                new MockResponse(),
                this.mockNextFn
            );
        });

        it('should call next with the error', function() {
            expect(this.mockNextFn).toHaveBeenCalled();
            expect(this.mockNextFn.calls.argsFor(0)[0]).toBe(this.mockErr);
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

    describe('with a \'load\' query param', function() {

        beforeEach(function() {
            this.mockFetchAllFn = function() {};
            spyOn(this, 'mockFetchAllFn').and.returnValue(new MockPromise());
            this.mockModel = MockModel.get('items', {
                fetchAll: this.mockFetchAllFn
            });
            this.k.expose(this.mockModel);
            this.mockApp.getHandlers['/items'](
                new MockRequest({
                    query: {
                        load: 'orders,companies'
                    }
                }),
                new MockResponse()
            );
        });

        it('should call load and pass an array of relation objects', function() {
            expect(this.mockFetchAllFn).toHaveBeenCalled();
            expect(this.mockFetchAllFn.calls.argsFor(0)[0].withRelated)
                            .toEqual(['orders','companies']);
        });

    });

    describe('with a before hook', function() {

        describe('that runs without executing any code', function() {

            hookExecTest('before', 'GetItems', '/items');

            it('should pass model argument to the hook', function() {
                expect(this.hookFn.calls.argsFor(0)[2])
                    .toBe(this.mockModel.modelInstances[0]);
            });

            it('should call fetchAll', function() {
                expect(this.mockFetchAll).toHaveBeenCalled();
            });

        });

        describe('that throws an error', function() {
            hookErrorTest('before', 'GetItems', '/items');
        });

        describe('that sends a response', function() {

            beforeEach(function() {
                setupHook.call(
                    this, 'before', 'GetItems', '/items',
                    function(req, res) { res.send(true); }
                );
            });

            it('should not call fetchAll', function() {
                expect(this.mockFetchAll).not.toHaveBeenCalled();
            });

        });

        describe('that returns a promise', function() {

            hookPromiseTest('before', 'GetItems', '/items');

            it('should not call fetchAll', function() {
                expect(this.mockFetchAll).not.toHaveBeenCalled();
            });

        });

    });

    describe('with an after hook', function() {

        describe('that runs without executing any code', function() {

            hookExecTest('after', 'GetItems', '/items');

            it('should pass the result of fetchAll to the hook', function() {
                expect(this.hookFn.calls.argsFor(0)[2])
                    .toBe(this.mockFetchAllResult);
            });

        });

        describe('that throws an error', function() {
            hookErrorTest('after', 'GetItems', '/items', true);
        });

        describe('that sends a response', function() {
            singleResponseHookTest('after', 'GetItems', '/items');
        });

        describe('that returns a promise', function() {
            hookPromiseTest('after', 'GetItems', '/items');
        });

    });

});