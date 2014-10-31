describe('DELETE request to delete an item', function() {

    beforeEach(function() {
        this.mockApp = new MockApp();
        this.k = require('../index')(this.mockApp);
    });

    describe('for an item that exists', function() {

        beforeEach(function() {
            this.mockRequest = new MockRequest({
                params: { identifier: '1' }
            });
            this.mockResponse = new MockResponse();
            var m = MockModel.get();
            mockModel = MockModel.get('items', {
                fetch: function() {
                    return new MockPromise([new m()]);
                }
            });
            spyOn(this.mockResponse, 'send');
            this.k.expose(mockModel);
            this.mockApp.deleteHandlers['/items/:identifier'](
                this.mockRequest,
                this.mockResponse
            );
        });

        it('should set attributes on the model that will be fetched', function() {
            expect(mockModel.modelInstances[0].attributes)
                .toEqual({ id : '1' });
        });

        it('should respond with true', function() {
            expect(this.mockResponse.send.calls.argsFor(0)[0])
                .toEqual(true);
        });

    });

    describe('for an item that does not exist', function() {

        beforeEach(function() {
            var $this = this;
            this.p = new MockPromise();
            this.mockRequest = new MockRequest({
                params: { identifier: '1' }
            });
            this.mockResponse = new MockResponse();
            mockModel = MockModel.get('items', {
                fetch: function() {
                    return $this.p;
                }
            });
            spyOn(this.mockResponse, 'send');
            this.k.expose(mockModel);
            this.mockApp.deleteHandlers['/items/:identifier'](
                this.mockRequest,
                this.mockResponse
            );
        });

        it('should throw an error', function() {
            expect(this.p.thrownError.message)
                .toEqual('Error deleting items. id = ' +
                    this.mockRequest.params.identifier + ' not found');
        });

        it('should respond with the fetched model', function() {
            expect(this.mockResponse.send.calls.argsFor(0)[0])
                .toEqual('Error deleting items');
        });

    });

});