describe('GET request for a relation', function() {

    beforeEach(function() {
        this.mockApp = new MockApp();
        this.k = requireKalamata()(this.mockApp);
    });

    describe('for a model that exists', function() {

        beforeEach(function() {
            var $this = this;
            this.mockCollection = {};
            this.mockModel = MockModel.get('items', {
                related: function() {
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

    describe('for a model that does not exist', function() {

        beforeEach(function() {
            var $this = this;
            this.mockNextFn = function() {};
            spyOn(this, 'mockNextFn');
            this.mockModel = MockModel.get('items', {
                fetch: function() {
                    return new MockPromise([null]);
                }
            });
            this.k.expose(this.mockModel);
            this.mockResponse = new MockResponse();
            spyOn(this.mockResponse, 'send');
            var fn = this.mockApp.getHandlers['/items/:identifier/:relation'];
            fn(
                new MockRequest({
                    params: { identifier: '1' },
                    method: 'GET',
                    url: 'mock.com/items/1/things'
                }),
                this.mockResponse,
                this.mockNextFn
            );
        });

        it('should call next with a not found error', function() {
            expect(this.mockNextFn).toHaveBeenCalled();
            expect(this.mockNextFn.calls.argsFor(0)[0].message)
                    .toEqual('GET mock.com/items/1/things failed: id = 1 not found');
        });

        it('should not send a response', function() {
            expect(this.mockResponse.send).not.toHaveBeenCalled();
        });

    });

    describe('with a before hook', function() {

        describe('that runs without executing any code', function() {

            beforeEach(function() {
                var $this = this;
                this.hookFn = function() {}
                this.k.expose(MockModel.get('items'));
                this.k.expose(MockModel.get('things'));
                this.k.beforeGetRelatedThings(function() {
                    $this.hookFn();
                });
                this.mockResponse = new MockResponse();
                spyOn(this.mockResponse, 'send');
                spyOn(this, 'hookFn');
                var fn = this.mockApp.getHandlers['/items/:identifier/:relation'];
                fn(new MockRequest({
                    params: { identifier: '1', relation: 'things' }
                }), this.mockResponse);
            });

            it('should call the hook', function() {
                expect(this.hookFn).toHaveBeenCalled();
            });

            it('should send a response', function() {
                expect(this.mockResponse.send).toHaveBeenCalled();
            });

        });

        describe('that throws an error', function() {

            beforeEach(function() {
                var $this = this;
                this.mockNextFn = function() {};
                this.hookFn = function() {
                    $this.mockError = new Error('mock error');
                    throw $this.mockError;
                }
                this.k.expose(MockModel.get('items'));
                this.k.expose(MockModel.get('things'));
                this.k.beforeGetRelatedThings(function() {
                    $this.hookFn();
                });
                this.mockResponse = new MockResponse();
                spyOn(this.mockResponse, 'send');
                spyOn(this, 'mockNextFn');
                var fn = this.mockApp.getHandlers['/items/:identifier/:relation'];
                try {
                    fn(new MockRequest({
                        params: { identifier: '1', relation: 'things' }
                    }), this.mockResponse, this.mockNextFn);
                } catch(err) {
                    this.error = err;
                }
            });

            it('should throw an error', function() {
                expect(this.error).toBeDefined();
                expect(this.error).toBe(this.mockError);
            });

        });

    });

});