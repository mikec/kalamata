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
            this.mockNextFn = function() {};
            spyOn(this, 'mockNextFn');
            this.p = new MockPromise();
            this.k.expose(MockModel.get('items', {
                fetch: function() {
                    return $this.p;
                }
            }));
            this.mockApp.deleteHandlers['/items/:identifier'](
                new MockRequest({
                    params: { identifier: 1 },
                    method: 'DELETE',
                    url: 'mock.com/items/1'
                }),
                new MockResponse(),
                this.mockNextFn
            );
        });

        it('should call next with an item not found error', function() {
            expect(this.mockNextFn).toHaveBeenCalled();
            expect(this.mockNextFn.calls.argsFor(0)[0].message)
                    .toEqual('DELETE mock.com/items/1 failed: id = 1 not found');
        });

    });

    describe('with a before hook', function() {

        describe('that runs without executing any code', function() {

            hookExecTest('before', 'DeleteItem', '/items/:identifier');

            it('should pass the fetch result argument to the hook', function() {
                expect(this.hookFn.calls.argsFor(0)[2])
                    .toBe(this.mockFetchResult);
            });

            it('should call destroy on the fetch result', function() {
                expect(this.mockFetchResult.destroy).toHaveBeenCalled();
            });

        });

        describe('that throws an error', function() {

            hookErrorTest('before', 'DeleteItem', '/items/:identifier', true);

            it('should not call destroy on the fetch result', function() {
                expect(this.mockFetchResult.destroy).not.toHaveBeenCalled();
            });

        });

        describe('that sends a response', function() {

            beforeEach(function() {
                setupHook.call(
                    this, 'before', 'DeleteItem', '/items/:identifier',
                    function(req, res) { res.send(true); }
                );
            });

            it('should not call destroy on the fetch result', function() {
                expect(this.mockFetchResult.destroy).not.toHaveBeenCalled();
            });

        });

        describe('that returns a promise', function() {

            hookPromiseTest('before', 'DeleteItem', '/items/:identifier');

            it('should not call destroy on the fetch result', function() {
                expect(this.mockFetchResult.destroy).not.toHaveBeenCalled();
            });

        });

    });

    describe('with an after hook', function() {

       describe('that runs without executing any code', function() {

            hookExecTest('after', 'DeleteItem', '/items/:identifier');

            it('should pass the fetch result to the hook', function() {
                expect(this.hookFn.calls.argsFor(0)[2])
                    .toBe(this.mockFetchResult);
            });

        });

        describe('that throws an error', function() {
            hookErrorTest('after', 'DeleteItem', '/items/:identifier', true);
        });

        describe('that sends a response', function() {
            singleResponseHookTest('after', 'DeleteItem', '/items/:identifier');
        });

        describe('that returns a promise', function() {
            hookPromiseTest('after', 'DeleteItem', '/items/:identifier');
        });

    });

});