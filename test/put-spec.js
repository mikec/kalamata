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
            this.p = new MockPromise();
            this.mockParams = { identifier: '1' };
            this.mockRequest = new MockRequest({
                params: this.mockParams
            });
            this.mockResponse = new MockResponse();
            spyOn(this.mockResponse, 'send');
            this.k.expose(MockModel.get('items', {
                fetch: function() {
                    return $this.p;
                }
            }));
            try {
                this.mockApp.putHandlers['/items/:identifier'](
                    this.mockRequest,
                    this.mockResponse
                );
            } catch(err) {
                this.error = err;
            }
        });

        it('should throw an error', function() {
            expect(this.error.message).toBe('Update Item failed: id = '
                + this.mockParams.identifier + ' not found');
        });

    });

    /*describeTestsForHooks('put', '/items/:identifier', [
        {
            hookType: 'before',
            expect: ['1', { data: 'mock' }]
        },
        {
            hookType: 'after',
            expect: [{ type: 'MockModel' }]
        },
        {
            hookType: 'beforeUpdate',
            expect: ['1', { data: 'mock' }]
        },
        {
            hookType: 'afterUpdate',
            expect: [{ type: 'MockModel' }]
        }
    ]);

    describeTestsForHookError('before', 'put', '/items/:identifier');
    describeTestsForHookError('after', 'put', '/items/:identifier');
    describeTestsForHookError('beforeUpdate', 'put', '/items/:identifier');
    describeTestsForHookError('afterUpdate', 'put', '/items/:identifier');*/

});