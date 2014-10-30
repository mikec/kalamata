describe('PUT request to update an item', function() {

    beforeEach(function() {
        this.mockApp = new MockApp();
        this.k = require('../index')(this.mockApp);
    });

    describe('for an item that exists', function() {

        beforeEach(function() {
            var $this = this;
            this.mockRequest = new MockRequest({
                params: { identifier: '1' },
                body: { name: 'mock' }
            });
            this.mockResponse = new MockResponse();
            this.mockFetchedModel = {
                save: function() {}
            };
            this.mockModel = MockModel.get('items', {
                fetch: function() {
                    return new MockPromise([$this.mockFetchedModel]);
                }
            });
            spyOn(this.mockFetchedModel, 'save');
            spyOn(this.mockResponse, 'send');
            this.k.expose(this.mockModel);
            this.mockApp.putHandlers['/items/:identifier'](
                this.mockRequest,
                this.mockResponse
            );
        });

        it('should set attributes on the model that will be fetched', function() {
            expect(this.mockModel.modelInstances[0].attributes)
                .toEqual({ id : '1' });
        });

        it('should save model and patch with request body data', function() {
            expect(this.mockFetchedModel.save.calls.argsFor(0))
                .toEqual([this.mockRequest.body, { patch: true }]);
        });

        it('should respond with true', function() {
            expect(this.mockResponse.send.calls.argsFor(0)[0]).toEqual(true);
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
            spyOn(this.mockResponse, 'send');
            this.k.expose(MockModel.get('items', {
                fetch: function() {
                    return $this.p;
                }
            }));
            this.mockApp.putHandlers['/items/:identifier'](
                this.mockRequest,
                this.mockResponse
            );
        });

        it('should throw an error', function() {
            expect(this.p.thrownError.message)
                .toEqual('Error updating items. id = ' +
                    this.mockRequest.params.identifier + ' not found');
        });

        it('should respond with an error', function() {
            expect(this.mockResponse.send.calls.argsFor(0)[0])
                .toEqual('Error getting items');
        });

    });

});