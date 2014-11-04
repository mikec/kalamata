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

    describe('with an identifier for an item that does not exist', function() {

        beforeEach(function() {
            var $this = this;
            this.p = new MockPromise();
            var mockModel = MockModel.get('items', {
                fetch: function() {
                    return new MockPromise([null], $this.p);
                }
            });
            this.mockRequest = new MockRequest({
                params: { identifier: '1' }
            });
            this.k.expose(mockModel);
            var fn = this.mockApp.getHandlers['/items/:identifier'];
            try {
                fn(this.mockRequest, new MockResponse());
            } catch(err) {
                this.error = err;
            }
        });

        it('should throw an error on fetch callback', function() {
            expect(this.error.message)
                .toEqual('Get Item failed: id = ' +
                            this.mockRequest.params.identifier + ' not found');
        });

        it('should not define an inner error', function() {
            expect(this.error.inner).toBeUndefined();
        });

    });

    describe('when the call to fetch() throws an error', function() {

        beforeEach(function() {
            var mockModel = MockModel.get('items', {
                fetch: function() {
                    return new MockFailPromise(new Error('mock error'));
                }
            });
            this.mockRequest = new MockRequest({
                params: { identifier: '1' }
            });
            this.k.expose(mockModel);
            var fn = this.mockApp.getHandlers['/items/:identifier'];
            try {
                fn(this.mockRequest, new MockResponse());
            } catch(err) {
                this.error = err;
            }
        });

        it('should throw a \'Get Item failed\' error', function() {
            expect(this.error.message).toEqual('Get Item failed');
        });

        it('should set the inner error', function() {
            expect(this.error.inner.message).toEqual('mock error');
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
                    function(req, res) {
                        res.send(true);
                    }
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

            beforeEach(function() {
                setupHook.call(
                    this, 'after', 'GetItem', '/items/:identifier',
                    function() {}
                );
            });

            it('should pass the result of fetch to the hook', function() {
                expect(this.hookFn.calls.argsFor(0)[2])
                    .toBe(this.mockFetchResult);
            });

        });

        describe('that throws an error', function() {
            hookErrorTest('after', 'GetItem', '/items/:identifier');
        });

        describe('that sends a response', function() {
            singleResponseHookTest('after', 'GetItem', '/items/:identifier');
        });

        describe('that returns a promise', function() {
            hookPromiseTest('after', 'GetItem', '/items/:identifier');
        });

    });

});