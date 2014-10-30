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

    describeTestsForHooks('get', '/items/:identifier', [
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
    describeTestsForHookError('afterGet', 'get', '/items/:identifier');

});