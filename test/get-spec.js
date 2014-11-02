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

    /*describeTestsForHooks('get', '/items/:identifier', [
        {
            hookType: 'before',
            expect: ['1']
        },
        {
            hookType: 'after',
            expect: [{ type: 'MockModel' }]
        },
        {
            hookType: 'beforeGet',
            expect: ['1']
        },
        {
            hookType: 'afterGet',
            expect: [{ type: 'MockModel' }]
        }
    ]);

    describeTestsForHookError('before', 'get', '/items/:identifier');
    describeTestsForHookError('after', 'get', '/items/:identifier');
    describeTestsForHookError('beforeGet', 'get', '/items/:identifier');
    describeTestsForHookError('afterGet', 'get', '/items/:identifier');*/

});