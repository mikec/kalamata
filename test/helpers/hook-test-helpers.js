
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
            this.mockApp[handlerType + 'Handlers'][endpoint](
                mockRequest,
                mockResponse
            );
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

global.describeTestsForHooks =
function(handlerType, endpoint, hooksToTest) {
    describe('with hooks setup', function() {

        beforeEach(function() {
            this.hooks = {};
            var kChainer = this.k.expose(MockModel.get('items'))
            for(var i in hooksToTest) {
                var h = hooksToTest[i];
                this.hooks[h.hookType] = function() {};
                spyOn(this.hooks, h.hookType);
                kChainer = kChainer[h.hookType](this.hooks[h.hookType]);
            }
            this.mockResponse = new MockResponse();
            this.mockRequest = new MockRequest({
                params: { identifier: '1' },
                body: { data: 'mock' }
            });
            this.mockApp[handlerType+'Handlers'][endpoint](
                this.mockRequest,
                this.mockResponse
            );
        });

        for(var j in hooksToTest) {
            var h = hooksToTest[j];
            if(!h.expect) h.expect = [];
            setupTest(h);
        }

        function setupTest(h) {
            it('should call the ' + h.hookType + ' hook with the correct arguments',
            function() {
                for(var n in h.expect) {
                    var val = h.expect[n];
                    if(val.type == 'MockModelCollection') {
                        expect(this.hooks[h.hookType].calls.argsFor(0)[n][0].fetch)
                            .toBeDefined();
                    } else if (val.type == 'MockModel') {
                        expect(this.hooks[h.hookType].calls.argsFor(0)[n].fetch)
                            .toBeDefined();
                    } else {
                        expect(this.hooks[h.hookType].calls.argsFor(0)[n])
                            .toEqual(val);
                    }
                }
                expect(this.hooks[h.hookType].calls.argsFor(0)[h.expect.length])
                        .toEqual(this.mockRequest);
                expect(this.hooks[h.hookType].calls.argsFor(0)[h.expect.length+1])
                        .toEqual(this.mockResponse);
            });
        }

    });
};
