describe('POST request to create a new item', function() {

    var mockApp, mockResponse, mockRequest, k;

    beforeEach(function() {
        mockApp = new MockApp();
        k = require('../index')(mockApp);
    });

    describe('and save succeeded', function() {

        var mockFetchedModel = {
            get: function() { return '1'; }
        };

        beforeEach(function() {
            var mockModel = new MockModel('items', {
                save: function() {
                    return new MockPromise([mockFetchedModel]);
                }
            });
            k.expose(mockModel);
            mockResponse = new MockResponse();
            spyOn(mockResponse, 'send');
            mockApp.postHandlers['/items'](new MockRequest(), mockResponse);
        });

        it('should response with the identifier of the new item', function() {
            expect(mockResponse.send.calls.argsFor(0)[0])
                .toEqual({ id : '1' });
        });

    });

    describe('and save failed', function() {

        beforeEach(function() {
            mockRequest = new MockRequest({
                body: { name: 'mock' }
            });
            var mockModel = new MockModel('items', {
                save: function() {
                    return new MockFailPromise();
                }
            });
            k.expose(mockModel);
            mockResponse = new MockResponse();
            spyOn(mockResponse, 'send');
            mockApp.postHandlers['/items'](mockRequest, mockResponse);
        });

        it('should response with an error', function() {
            expect(mockResponse.send.calls.argsFor(0)[0])
                .toEqual('Error saving items ' +
                            JSON.stringify(mockRequest.body));
        });

    });

});