describe('GET request for single item', function() {

    beforeEach(function() {
        this.mockApp = new MockApp();
        this.k = require('../index')(this.mockApp);
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
            this.mockResponse = new MockResponse();
            spyOn(this.mockResponse, 'send');
            var fn = this.mockApp.getHandlers['/items/:identifier']
            fn(this.mockRequest, this.mockResponse);
        });

        it('should respond with an error', function() {
            expect(this.mockResponse.send.calls.argsFor(0)[0])
                .toEqual('Error getting items');
        });

        it('should throw an error on fetch callback', function() {
            expect(this.p.thrownError.message)
                .toEqual('Error getting items. id = ' +
                            this.mockRequest.params.identifier + ' not found');
        });

    });

    describe('with hooks setup', function() {

        beforeEach(function() {
            var $this = this;
            this.mockFetchedModel = { name: 'mock' };
            var mockModel = MockModel.get('items', {
                fetch: function() {
                    return new MockPromise([$this.mockFetchedModel]);
                }
            });
            this.hooks = {
                before: function() { },
                after: function() { },
                beforeGet: function() { },
                afterGet: function() { }
            };
            spyOn(this.hooks, 'before');
            spyOn(this.hooks, 'after');
            spyOn(this.hooks, 'beforeGet');
            spyOn(this.hooks, 'afterGet');
            this.k.expose(mockModel)
                .before(this.hooks.before)
                .after(this.hooks.after)
                .beforeGet(this.hooks.beforeGet)
                .afterGet(this.hooks.afterGet);
            this.mockResponse = new MockResponse();
            this.mockRequest = new MockRequest({
                params: { identifier: '1' }
            });
            this.mockApp.getHandlers['/items/:identifier'](
                this.mockRequest,
                this.mockResponse
            );
        });

        it('should call the before hook with the correct arguments',
        function() {
            expect(this.hooks.before.calls.argsFor(0))
                .toEqual(['1', this.mockRequest, this.mockResponse]);
        });

        it('should call the after hook with the correct arguments',
        function() {
            expect(this.hooks.after.calls.argsFor(0))
                .toEqual([
                    this.mockFetchedModel,
                    this.mockRequest,
                    this.mockResponse
                ]);
        });

        it('should call the beforeGet hook with the correct arguments',
        function() {
            expect(this.hooks.beforeGet.calls.argsFor(0))
                    .toEqual(['1', this.mockRequest, this.mockResponse]);
        });

        it('should call the afterGet hook with the correct arguments',
        function() {
            expect(this.hooks.afterGet.calls.argsFor(0))
                    .toEqual([
                        this.mockFetchedModel,
                        this.mockRequest,
                        this.mockResponse
                    ]);
        });

    });

    describeTestsForHookError('before', 'get', '/items/:identifier');
    describeTestsForHookError('after', 'get', '/items/:identifier');
    describeTestsForHookError('beforeGet', 'get', '/items/:identifier');
    describeTestsForHookError('afterGet', 'get', '/items/:identifier');

});