describe('POST request to create a new item', function() {

    beforeEach(function() {
        this.mockApp = new MockApp();
        this.k = requireKalamata()(this.mockApp);
    });

    describe('and save succeeded', function() {

        beforeEach(function() {
            var $this = this;
            this.mockDataResponse = { mocked: true };
            this.k.expose(MockModel.get('items', {
                save: function() {
                    return new MockPromise([{
                        toJSON: function() {
                            return $this.mockDataResponse;
                        }
                    }]);
                }
            }));
            this.mockResponse = new MockResponse();
            spyOn(this.mockResponse, 'send');
            this.mockApp.postHandlers['/items'](
                new MockRequest(),
                this.mockResponse
            );
        });

        it('should response with the identifier of the new item', function() {
            expect(this.mockResponse.send.calls.argsFor(0)[0])
                .toEqual(this.mockDataResponse);
        });

    });

    describe('and save failed', function() {

        beforeEach(function() {
            this.mockBody = { name: 'mock' };
            this.mockNextFn = function() {};
            spyOn(this, 'mockNextFn');
            this.mockRequest = new MockRequest({
                body: this.mockBody
            });
            this.k.expose(MockModel.get('items', {
                save: function() {
                    return new MockFailPromise();
                }
            }));
            this.mockApp.postHandlers['/items'](
                new MockRequest(),
                new MockResponse(),
                this.mockNextFn
            );
        });

        it('should call next with a Create Item failed error', function() {
            expect(this.mockNextFn).toHaveBeenCalled();
            expect(this.mockNextFn.calls.argsFor(0)[0]).toEqual(new Error('Create Item ' +
                    JSON.stringify(this.mockBody) + ' failed'));
        });

    });

    describe('with a before hook', function() {

        describe('that runs without executing any code', function() {

            hookExecTest('before', 'CreateItem', '/items');

            it('should pass model argument to the hook', function() {
                expect(this.hookFn.calls.argsFor(0)[2])
                    .toBe(this.mockModel.modelInstances[0]);
            });

            it('should call save', function() {
                expect(this.mockSave).toHaveBeenCalled();
            });

        });

        describe('that throws an error', function() {

            hookErrorTest('before', 'CreateItem', '/items');

            it('should not call save', function() {
                expect(this.mockSave).not.toHaveBeenCalled();
            });

        });

        describe('that sends a response', function() {

            beforeEach(function() {
                setupHook.call(
                    this, 'before', 'CreateItem', '/items',
                    function(req, res) {
                        res.send(true);
                    }
                );
            });

            it('should not call save', function() {
                expect(this.mockSave).not.toHaveBeenCalled();
            });

        });

        describe('that returns a promise', function() {

            hookPromiseTest('before', 'CreateItem', '/items');

            it('should not call save', function() {
                expect(this.mockSave).not.toHaveBeenCalled();
            });

        });

    });

    describe('with an after hook', function() {

        describe('that runs without executing any code', function() {

            hookExecTest('after', 'CreateItem', '/items');

            beforeEach(function() {
                setupHook.call(
                    this, 'after', 'CreateItem', '/items',
                    function() {}
                );
            });

            it('should pass the result of save to the hook', function() {
                expect(this.hookFn.calls.argsFor(0)[2])
                    .toBe(this.mockSaveResult);
            });

        });

        describe('that throws an error', function() {
            hookErrorTest('after', 'CreateItem', '/items', true);
        });

        describe('that sends a response', function() {
            singleResponseHookTest('after', 'CreateItem', '/items');
        });

        describe('that returns a promise', function() {
            hookPromiseTest('after', 'CreateItem', '/items');
        });

    });

});