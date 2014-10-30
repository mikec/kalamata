describe('GET request for single item', function() {

    var mockResponse, mockRequest;

    beforeEach(function() {
        this.mockApp = new MockApp();
        this.k = require('../index')(this.mockApp);
    });

    describe('with an identifier for an item that exists', function() {

        var mockFetchedModel = { name: 'mock' };

        beforeEach(function() {
            var mockModel = new MockModel('items', {
                fetch: function() {
                    return new MockPromise([mockFetchedModel]);
                }
            });
            this.k.expose(mockModel);
            mockResponse = new MockResponse();
            spyOn(mockResponse, 'send');
            var fn = this.mockApp.getHandlers['/items/:identifier']
            fn(new MockRequest(), mockResponse);
        });

        it('should instantiate a model instance', function() {
            expect(mockModel.modelInstances.length).toEqual(1);
        });

        it('should respond with the fetched model', function() {
            expect(mockResponse.send.calls.argsFor(0)[0])
                .toEqual(mockFetchedModel);
        });

    });

    describe('with an identifier for an item that does not exist', function() {

        var mockFetchedModel = { name: 'mock' };
        var p;

        beforeEach(function() {
            p = new MockPromise();
            var mockModel = new MockModel('items', {
                fetch: function() {
                    return new MockPromise([null], p);
                }
            });
            mockRequest = new MockRequest({
                params: { identifier: '1' }
            });
            this.k.expose(mockModel);
            mockResponse = new MockResponse();
            spyOn(mockResponse, 'send');
            var fn = this.mockApp.getHandlers['/items/:identifier']
            fn(mockRequest, mockResponse);
        });

        it('should respond with an error', function() {
            expect(mockResponse.send.calls.argsFor(0)[0])
                .toEqual('Error getting items');
        });

        it('should throw an error on fetch callback', function() {
            expect(p.thrownError.message)
                .toEqual('Error getting items. id = ' +
                            mockRequest.params.identifier + ' not found');
        });

    });

    describe('with hooks setup', function() {

        var hooks, mockFetchedModel;

        beforeEach(function() {
            mockFetchedModel = { name: 'mock' };
            var mockModel = new MockModel('items', {
                fetch: function() {
                    return new MockPromise([mockFetchedModel]);
                }
            });
            hooks = {
                before: function() { },
                after: function() { },
                beforeGet: function() { },
                afterGet: function() { }
            };
            spyOn(hooks, 'before');
            spyOn(hooks, 'after');
            spyOn(hooks, 'beforeGet');
            spyOn(hooks, 'afterGet');
            this.k.expose(mockModel)
                .before(hooks.before)
                .after(hooks.after)
                .beforeGet(hooks.beforeGet)
                .afterGet(hooks.afterGet);
            mockResponse = new MockResponse();
            mockRequest = new MockRequest({
                params: { identifier: '1' }
            });
            this.mockApp.getHandlers['/items/:identifier'](mockRequest, mockResponse);
        });

        it('should call the before hook with the correct arguments',
        function() {
            expect(hooks.before.calls.argsFor(0))
                .toEqual(['1', mockRequest, mockResponse]);
        });

        it('should call the after hook with the correct arguments',
        function() {
            expect(hooks.after.calls.argsFor(0))
                .toEqual([mockFetchedModel, mockRequest, mockResponse]);
        });

        it('should call the beforeGet hook with the correct arguments',
        function() {
            expect(hooks.beforeGet.calls.argsFor(0))
                    .toEqual(['1', mockRequest, mockResponse]);
        });

        it('should call the afterGet hook with the correct arguments',
        function() {
            expect(hooks.afterGet.calls.argsFor(0))
                    .toEqual([mockFetchedModel, mockRequest, mockResponse]);
        });

    });

    describeTestsForHookError('before', 'get', '/items/:identifier');
    describeTestsForHookError('after', 'get', '/items/:identifier');
    describeTestsForHookError('beforeGet', 'get', '/items/:identifier');
    describeTestsForHookError('afterGet', 'get', '/items/:identifier');

});