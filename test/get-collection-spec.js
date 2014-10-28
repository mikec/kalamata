describe('GET request for collection', function() {

    var mockApp, mockResponse, k, fetchAllCalled;

    beforeEach(function() {
        mockApp = new MockApp();
        fetchAllCalled = false;
        var mockModel = new MockModel('items', {
            fetchAll: function() {
                fetchAllCalled = true;
                return new MockPromise(['foo']);
            }
        });
        k = require('../index')(mockApp);
        k.expose(mockModel);
    })

    describe('without any query params', function() {

        beforeEach(function() {
            mockResponse = new MockResponse();
            spyOn(mockResponse, 'send');
            mockApp.getHandlers['/items'](new MockRequest(), mockResponse);
        });

        it('should call fetchAll', function() {
            expect(fetchAllCalled).toBeTruthy();
        });

        it('should respond with the result of the fetchAll promise', function() {
            expect(mockResponse.send.calls.argsFor(0)[0]).toEqual('foo');
        });

    });

});