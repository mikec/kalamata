describe('PUT request to update an item', function() {

    beforeEach(function() {
        this.mockApp = new MockApp();
        this.k = requireKalamata()(this.mockApp);
    });

    describe('for an item that exists', function() {

        beforeEach(function() {
            var $this = this;
            this.mockRequest = new MockRequest({
                params: { identifier: '1' },
                body: { name: 'mock' }
            });
            this.mockResponse = new MockResponse();
            this.mockFetchedModel = new (MockModel.get('items'))();
            this.mockModel = MockModel.get('items', {
                fetch: function() {
                    return new MockPromise([$this.mockFetchedModel]);
                }
            });
            spyOn(this.mockFetchedModel, 'set');
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

        it('should set req.body properties on the model', function() {
            expect(this.mockFetchedModel.set.calls.argsFor(0)[0].name)
                .toEqual('mock');
        });

        it('should call save() on the model', function() {
            expect(this.mockFetchedModel.save).toHaveBeenCalled();
        });

        it('should respond with the model converted to JSON', function() {
            expect(this.mockResponse.send.calls.argsFor(0)[0].name)
                .toEqual('mock toJSON() result');
        });

    });

    describe('for an item that does not exist', function() {

        beforeEach(function() {
            var $this = this;
            this.mockNextFn = function() {};
            spyOn(this, 'mockNextFn');
            this.p = new MockPromise();
            this.mockParams = { identifier: '1' };
            this.k.expose(MockModel.get('items', {
                fetch: function() {
                    return $this.p;
                }
            }));
            this.mockApp.putHandlers['/items/:identifier'](
                new MockRequest({
                    params: this.mockParams,
                    method: 'PUT',
                    url: 'mock.com/items/1'
                }),
                new MockResponse(),
                this.mockNextFn
            );
        });

        it('should call next with a not found error', function() {
            expect(this.mockNextFn).toHaveBeenCalled();
            expect(this.mockNextFn.calls.argsFor(0)[0].message)
                    .toEqual('PUT mock.com/items/1 failed: id = 1 not found');
        });

    });

    describe('with a before hook', function() {

        describe('that runs without executing any code', function() {

            hookExecTest('before', 'UpdateItem', '/items/:identifier');

            it('should pass the fetch result argument to the hook', function() {
                expect(this.hookFn.calls.argsFor(0)[2])
                    .toBe(this.mockFetchResult);
            });

            it('should call save on the fetch result', function() {
                expect(this.mockFetchResult.save).toHaveBeenCalled();
            });

        });

        describe('that throws an error', function() {

            hookErrorTest('before', 'UpdateItem', '/items/:identifier', true);

            it('should not call save on the fetch result', function() {
                expect(this.mockFetchResult.save).not.toHaveBeenCalled();
            });

        });

        describe('that sends a response', function() {

            beforeEach(function() {
                setupHook.call(
                    this, 'before', 'UpdateItem', '/items/:identifier',
                    function(req, res) { res.send(true); }
                );
            });

            it('should not call save on the fetch result', function() {
                expect(this.mockFetchResult.save).not.toHaveBeenCalled();
            });

            it('should not throw an error', function() {
                expect(this.mockNextFn).not.toHaveBeenCalled();
            });

        });

        describe('that returns a promise', function() {

            hookPromiseTest('before', 'UpdateItem', '/items/:identifier');

            it('should not call save on the fetch result', function() {
                expect(this.mockFetchResult.save).not.toHaveBeenCalled();
            });

        });

    });

    describe('with an after hook', function() {

       describe('that runs without executing any code', function() {

            hookExecTest('after', 'UpdateItem', '/items/:identifier');

            it('should pass the fetch result to the hook', function() {
                expect(this.hookFn.calls.argsFor(0)[2])
                    .toBe(this.mockFetchResult);
            });

        });

        describe('that throws an error', function() {
            hookErrorTest('after', 'UpdateItem', '/items/:identifier', true);
        });

        describe('that sends a response', function() {
            singleResponseHookTest('after', 'UpdateItem', '/items/:identifier');
        });

        describe('that returns a promise', function() {
            hookPromiseTest('after', 'UpdateItem', '/items/:identifier');
        });

    });

});