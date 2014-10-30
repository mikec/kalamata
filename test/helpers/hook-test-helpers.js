
global.describeTestsForHookError =
function(hookType, handlerType, endpoint) {

    describe('and the \'' + hookType + '\' hook that throws an error',
    function() {

        var hooks, mockModel, mockRequest, mockResponse;

        beforeEach(function() {
            hooks = { };
            hooks[hookType] = function() { }
            spyOn(hooks, hookType).and.throwError(hookType + ' hook error');
            mockModel = MockModel.get('items');
            this.k.expose(mockModel)[hookType](hooks[hookType]);
            mockResponse = new MockResponse();
            mockRequest = new MockRequest();
            spyOn(mockResponse, 'send');
            this.mockApp[handlerType + 'Handlers'][endpoint](mockRequest, mockResponse);
        });

        if(hookType.indexOf('before') !== -1) {
            it('should not instantiate a model instance', function() {
                expect(mockModel.modelInstances.length).toEqual(0);
            });
        } else {
            it('should instantiate a model instance', function() {
                expect(mockModel.modelInstances.length).toEqual(1);
            });
        }

        it('should respond with an error', function() {
            expect(mockResponse.send.calls.argsFor(0)[0])
                .toEqual('Error getting items');
        });

    });

};
