describe('GET request for single item', function() {

    beforeEach(function() {
        this.mockApp = new MockApp();
        this.k = requireKalamata()(this.mockApp);
    });

    describe('with an identifier for an item that exists', function() {

        beforeEach(function() {
            var $this = this;
            this.mockFetchedModel = { name: 'mock' };
            this.mockModel = MockModel.get('items', {
                fetch: function() {
                    return new MockPromise([$this.mockFetchedModel]);
                }
            });
            this.k.expose(this.mockModel);
            this.mockResponse = new MockResponse();
            spyOn(this.mockResponse, 'send');
            var fn = this.mockApp.getHandlers['/items/:identifier']
            fn(new MockRequest(), this.mockResponse);
        });

        it('should instantiate a model instance', function() {
            expect(this.mockModel.modelInstances.length).toEqual(1);
        });

        it('should respond with the fetched model', function() {
            expect(this.mockResponse.send.calls.argsFor(0)[0])
                .toEqual(this.mockFetchedModel);
        });

    });

    describe('with a \'load\' query param', function() {

        beforeEach(function() {
            this.mockFetchFn = function() {};
            spyOn(this, 'mockFetchFn').and.returnValue(new MockPromise());
            this.mockModel = MockModel.get('items', {
                fetch: this.mockFetchFn
            });
            this.k.expose(this.mockModel);
            this.mockApp.getHandlers['/items/:identifier'](
                new MockRequest({
                    query: {
                        load: 'users,things'
                    }
                }),
                new MockResponse()
            );
        });

        it('should call load and pass an array of relations', function() {
            expect(this.mockFetchFn).toHaveBeenCalled();
            expect(this.mockFetchFn.calls.argsFor(0)[0].withRelated)
                            .toEqual(['users','things']);
        });

    });

    describe('with an identifier for an item that does not exist', function() {

        beforeEach(function() {
            var $this = this;
            this.p = new MockPromise();
            var mockModel = MockModel.get('items', {
                fetch: function() {
                    return new MockPromise([null], $this.p);
                }
            });
            this.mockNextFn = function() {};
            spyOn(this, 'mockNextFn');
            this.k.expose(mockModel);
            var fn = this.mockApp.getHandlers['/items/:identifier'](
                new MockRequest({
                    params: { identifier: '1' },
                    method: 'GET',
                    url: 'mock.com/items/1'
                }),
                new MockResponse(),
                this.mockNextFn
            );
        });

        it('should call next with a not found error', function() {
            expect(this.mockNextFn).toHaveBeenCalled();
            expect(this.mockNextFn.calls.argsFor(0)[0].message)
                        .toEqual('GET mock.com/items/1 failed: id = 1 not found');
        });

    });

    describe('when the call to fetch() throws an error', function() {

        beforeEach(function() {
            var $this = this;
            this.mockErr = new Error('mock error');
            var mockModel = MockModel.get('items', {
                fetch: function() {
                    return new MockFailPromise($this.mockErr);
                }
            });
            this.mockNextFn = function() {};
            spyOn(this, 'mockNextFn');
            this.k.expose(mockModel);
            var fn = this.mockApp.getHandlers['/items/:identifier'](
                new MockRequest(), new MockResponse(), this.mockNextFn
            );
        });

        it('should call next with the error', function() {
            expect(this.mockNextFn).toHaveBeenCalled();
            expect(this.mockNextFn.calls.argsFor(0)[0])
                .toBe(this.mockErr);
        });

    });

    describe('with a before hook', function() {

        describe('that runs without executing any code', function() {

            hookExecTest('before', 'GetItem', '/items/:identifier');

            it('should pass model argument to the hook', function() {
                expect(this.hookFn.calls.argsFor(0)[2])
                    .toBe(this.mockModel.modelInstances[0]);
            });

            it('should call fetch', function() {
                expect(this.mockFetch).toHaveBeenCalled();
            });

        });

        describe('that throws an error', function() {

            hookErrorTest('before', 'GetItem', '/items/:identifier');

            it('should not call fetch', function() {
                expect(this.mockFetch).not.toHaveBeenCalled();
            });

        });

        describe('that sends a response', function() {

            beforeEach(function() {
                setupHook.call(
                    this, 'before', 'GetItem', '/items/:identifier',
                    function(req, res) { res.send(true); }
                );
            });

            it('should not call fetch', function() {
                expect(this.mockFetch).not.toHaveBeenCalled();
            });

        });

        describe('that returns a promise', function() {

            hookPromiseTest('before', 'GetItem', '/items/:identifier');

            it('should not call fetch', function() {
                expect(this.mockFetch).not.toHaveBeenCalled();
            });

        });

    });

    describe('with an after hook', function() {

        describe('that runs without executing any code', function() {

            hookExecTest('after', 'GetItem', '/items/:identifier');

            it('should pass the result of fetch to the hook', function() {
                expect(this.hookFn.calls.argsFor(0)[2])
                    .toBe(this.mockFetchResult);
            });

        });

        describe('that throws an error', function() {
            hookErrorTest('after', 'GetItem', '/items/:identifier', true);
        });

        describe('that sends a response', function() {
            singleResponseHookTest('after', 'GetItem', '/items/:identifier');
        });

        describe('that returns a promise', function() {
            hookPromiseTest('after', 'GetItem', '/items/:identifier');
        });

    });

});