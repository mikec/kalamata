describe('GET request for a relation', function() {

    beforeEach(function() {
        this.mockApp = new MockApp();
        this.k = requireKalamata()(this.mockApp);
    });

    describe('without any query params', function() {

        beforeEach(function() {
            var $this = this;
            this.mockCollection = {};
            this.mockModel = MockModel.get('items', {
                related: function() {
                    console.log('RETURNING RELATED STUFF');
                    return new MockPromise([$this.mockCollection]);
                }
            });
            this.k.expose(this.mockModel);
            this.mockResponse = new MockResponse();
            spyOn(this.mockResponse, 'send');
            var fn = this.mockApp.getHandlers['/items/:identifier/:relation'];
            fn(new MockRequest(), this.mockResponse);
        });

        it('should respond with a collection of related models', function() {
            expect(this.mockResponse.send).toHaveBeenCalled();
            expect(this.mockResponse.send.calls.argsFor(0)[0])
                    .toBe(this.mockCollection);
        });

    });

});