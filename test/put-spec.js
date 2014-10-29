describe('PUT request to update an item', function() {

    var mockApp, mockResponse, mockRequest, k;

    beforeEach(function() {
        mockApp = new MockApp();
        k = require('../index')(mockApp);
    });

    describe('for an item that exists', function() {

        var mockModel, mockFetchedModel;
        var p;

        beforeEach(function() {
            mockRequest = new MockRequest({
                params: { identifier: '1' },
                body: { name: 'mock' }
            });
            mockResponse = new MockResponse();
            mockFetchedModel = {
                save: function() {}
            };
            mockModel = new MockModel('items', {
                fetch: function() {
                    return new MockPromise([mockFetchedModel]);
                }
            });
            spyOn(mockFetchedModel, 'save');
            spyOn(mockResponse, 'send');
            k.expose(mockModel);
            mockApp.putHandlers['/items/:identifier'](mockRequest, mockResponse);
        });

        it('should set attributes on the model that will be fetched', function() {
            expect(mockModel.modelInstances[0].attributes)
                .toEqual({ id : '1' });
        });

        it('should save model and patch with request body data', function() {
            expect(mockFetchedModel.save.calls.argsFor(0))
                .toEqual([mockRequest.body, { patch: true }]);
        });

        it('should respond with true', function() {
            expect(mockResponse.send.calls.argsFor(0)[0]).toEqual(true);
        });

    });

    describe('for an item that does not exist', function() {

        var mockModel, p;

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
            mockApp.putHandlers['/items/:identifier'](mockRequest, mockResponse);
        });

        it('should throw an error', function() {
            expect(p.thrownError.message)
                .toEqual('Error updating items. id = ' +
                    mockRequest.params.identifier + ' not found');
        });

        it('should respond with an error', function() {
            expect(mockResponse.send.calls.argsFor(0)[0])
                .toEqual('Error getting items');
        });

    });

});