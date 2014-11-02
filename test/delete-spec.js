describe('DELETE request to delete an item', function() {

    beforeEach(function() {
        this.mockApp = new MockApp();
        this.k = requireKalamata()(this.mockApp);
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
            this.mockParams = { identifier: '1' };
            this.mockRequest = new MockRequest({
                params: this.mockParams
            });
            this.k.expose(MockModel.get('items', {
                fetch: function() {
                    return $this.p;
                }
            }));
            try {
                this.mockApp.deleteHandlers['/items/:identifier'](
                    this.mockRequest,
                    new MockResponse()
                );
            } catch(err) {
                this.error = err;
            }
        });

        it('should throw an error', function() {
            expect(this.error.message).toBe('Delete Item failed: id = '
                + this.mockParams.identifier + ' not found');
        });

    });

});