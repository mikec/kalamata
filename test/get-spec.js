describe('GET request for single item', function() {

    var mockApp, mockResponse, mockRequest, k;

    beforeEach(function() {
        mockApp = new MockApp();
        k = require('../index')(mockApp);
    });

    describe('with an identifier for an item that exists', function() {

        var mockFetchedModel = { name: 'mock' };

        beforeEach(function() {
            var mockModel = new MockModel('items', {
                fetch: function() {
                    return new MockPromise([mockFetchedModel]);
                }
            });
            k.expose(mockModel);
            mockResponse = new MockResponse();
            spyOn(mockResponse, 'send');
            var fn = mockApp.getHandlers['/items/:identifier']
            fn(new MockRequest(), mockResponse);
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
            k.expose(mockModel);
            mockResponse = new MockResponse();
            spyOn(mockResponse, 'send');
            var fn = mockApp.getHandlers['/items/:identifier']
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

});