describe('POST request to create a relation', function() {

    beforeEach(function() {
        this.mockApp = new MockApp();
        this.k = requireKalamata()(this.mockApp);
    });

    describe('to an existing model', function() {

        beforeEach(function() {
            var $this = this;
            this.mockCollection = {
                create: function() {}
            };
            this.mockModel = MockModel.get('items', {
                related: function() {
                    return $this.mockCollection
                }
            });
            this.mockRelModel = MockModel.get('things');
            this.k.expose(this.mockModel);
            this.k.expose(this.mockRelModel);
            this.mockResponse = new MockResponse();
            spyOn(this.mockCollection, 'create');
            spyOn(this.mockResponse, 'send');
            var fn = this.mockApp.postHandlers['/items/:identifier/:relation'];
            fn(new MockRequest({
                    body: { id: 1 },
                    params: { relation: 'things' }
                }),
                this.mockResponse
            );
        });

        it('should call create on the related collection ', function() {
            expect(this.mockCollection.create).toHaveBeenCalled();
        });

        it('should pass the existing related model to the create call',
        function() {
            expect(this.mockCollection.create.calls.argsFor(0)[0])
                    .toBe(this.mockRelModel.modelInstances[0]);
        });

        it('should send a response', function() {
            expect(this.mockResponse.send).toHaveBeenCalled();
        });

    });

    describe('to an new model', function() {

        beforeEach(function() {
            var $this = this;
            this.mockCollection = {
                create: function() {}
            };
            this.mockModel = MockModel.get('items', {
                related: function() {
                    return $this.mockCollection
                }
            });
            this.mockRelModel = MockModel.get('things');
            this.k.expose(this.mockModel);
            this.k.expose(this.mockRelModel);
            this.mockResponse = new MockResponse();
            this.mockBody = {};
            spyOn(this.mockCollection, 'create');
            spyOn(this.mockResponse, 'send');
            var fn = this.mockApp.postHandlers['/items/:identifier/:relation'];
            fn(new MockRequest({
                    body: $this.mockBody,
                    params: { relation: 'things' }
                }),
                this.mockResponse
            );
        });

        it('should call create on the related collection ', function() {
            expect(this.mockCollection.create).toHaveBeenCalled();
        });

        it('should pass the request body to the create call',
        function() {
            expect(this.mockCollection.create.calls.argsFor(0)[0])
                    .toBe(this.mockBody);
        });

        it('should send a response', function() {
            expect(this.mockResponse.send).toHaveBeenCalled();
        });

    });

});