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
            this.mockRequest = new MockRequest({
                body: { name: 'mock' }
            });
            this.k.expose(MockModel.get('items', {
                save: function() {
                    return new MockFailPromise();
                }
            }));
            this.mockResponse = new MockResponse();
            spyOn(this.mockResponse, 'send');
            this.mockApp.postHandlers['/items'](this.mockRequest, this.mockResponse);
        });

        it('should response with an error', function() {
            expect(this.mockResponse.send.calls.argsFor(0)[0])
                .toEqual('Error saving items ' +
                            JSON.stringify(this.mockRequest.body));
        });

    });

    /*describeTestsForHooks('post', '/items', [
        {
            hookType: 'before',
            expect: [{ data: 'mock' }]
        },
        {
            hookType: 'after',
            expect: [{ type: 'MockModel' }]
        },
        {
            hookType: 'beforeCreate',
            expect: [{ data: 'mock' }]
        },
        {
            hookType: 'afterCreate',
            expect: [{ type: 'MockModel' }]
        }
    ]);

    describeTestsForHookError('before', 'post', '/items');
    describeTestsForHookError('after', 'post', '/items');
    describeTestsForHookError('beforeCreate', 'post', '/items');
    describeTestsForHookError('afterCreate', 'post', '/items');*/

});