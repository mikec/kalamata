describe('DELETE request to delete an item', function() {

    var mockApp, mockResponse, mockRequest, k;

    beforeEach(function() {
        mockApp = new MockApp();
        k = require('../index')(mockApp);
    });

    describe('for an item that exists', function() {

        var mockFetchedModel;

        beforeEach(function() {
            mockRequest = new MockRequest({
                params: { identifier: '1' }
            });
            mockResponse = new MockResponse();
            mockFetchedModel = {
                destroy: function() {}
            };
            mockModel = new MockModel('items', {
                fetch: function() {
                    return new MockPromise([mockFetchedModel]);
                }
            });
            spyOn(mockResponse, 'send');
            k.expose(mockModel);
            mockApp.deleteHandlers['/items/:identifier'](mockRequest, mockResponse);
        });

        it('should set attributes on the model that will be fetched', function() {
            expect(mockModel.modelInstances[0].attributes)
                .toEqual({ id : '1' });
        });

        it('should respond with the fetched model', function() {
            expect(mockResponse.send.calls.argsFor(0)[0])
                .toEqual(true);
        });

    });

    describe('for an item that does not exist', function() {

        var p;

        beforeEach(function() {
            p = new MockPromise();
            mockRequest = new MockRequest({
                params: { identifier: '1' }
            });
            mockResponse = new MockResponse();
            mockModel = new MockModel('items', {
                fetch: function() {
                    return p;
                }
            });
            spyOn(mockResponse, 'send');
            k.expose(mockModel);
            mockApp.deleteHandlers['/items/:identifier'](mockRequest, mockResponse);
        });

        it('should throw an error', function() {
            expect(p.thrownError.message)
                .toEqual('Error deleting items. id = ' +
                    mockRequest.params.identifier + ' not found');
        });

        it('should respond with the fetched model', function() {
            expect(mockResponse.send.calls.argsFor(0)[0])
                .toEqual('Error deleting items');
        });

    });

});