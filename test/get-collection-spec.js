describe('GET request for collection', function() {

    beforeEach(function() {
        this.mockApp = new MockApp();
        this.k = require('../index')(this.mockApp);
    });

    describe('without any query params', function() {

        beforeEach(function() {
            this.mockModel = MockModel.get('items', {
                fetchAll: function() {
                    return new MockPromise(['items']);
                }
            });
            this.k.expose(this.mockModel);
            this.mockResponse = new MockResponse();
            spyOn(this.mockResponse, 'send');
            this.mockApp.getHandlers['/items'](
                new MockRequest(),
                this.mockResponse
            );
        });

        it('should instantiate a new model', function() {
            expect(this.mockModel.modelInstances.length).toEqual(1);
        });

        it('should respond with the result of the fetchAll promise', function() {
            expect(this.mockResponse.send.calls.argsFor(0)[0]).toEqual('items');
        });

    });

    describe('with the \'where\' query param', function() {

        describe('set to a valid JSON object', function() {

            beforeEach(function() {
                setupWhereQueryTests
                    .call(this, '{"firstname":"mike","lastname":"c"}');
            });

            it('should call \'where\' on the model and pass the parsed query value',
            function() {
                expect(this.w.firstname).toEqual('mike');
                expect(this.w.lastname).toEqual('c');
            });

        });

        describe('set to a JSON object without quotes around property names',
        function() {

            beforeEach(function() {
                setupWhereQueryTests.call(this, '{firstname:"mike",lastname:"c"}');
            });

            it('should call \'where\' on the model and pass the parsed query value',
            function() {
                expect(this.w.firstname).toEqual('mike');
                expect(this.w.lastname).toEqual('c');
            });

        });

        describe('set to an invalid JSON object', function() {

            beforeEach(function() {
                setupWhereQueryTests.call(this, '{firstname}');
            });

            it('should send an error response', function() {
                expect(this.mockResponse.send.calls.argsFor(0)[0])
                    .toEqual("Error parsing JSON. '{firstname}' is not valid JSON");
            });

        });

        function setupWhereQueryTests(whereQueryVal) {
            var $this = this;
            this.w = null;
            var mockModel = MockModel.get('items', {
                where: function(_w) {
                    $this.w = _w;
                    return {
                        fetchAll: function() {
                            return new MockPromise(['items']);
                        }
                    }
                }
            });
            this.k.expose(mockModel);
            this.mockResponse = new MockResponse();
            spyOn(this.mockResponse, 'send');
            this.mockApp.getHandlers['/items'](new MockRequest({
                query: {
                    where: whereQueryVal
                }
            }), this.mockResponse);
        }

    });

    describeTestsForHooks('get', '/items', [
        {
            hookType: 'before'
        },
        {
            hookType: 'after',
            expect: [[{ name: 'mock' },{ name: 'mock' }]]
        },
        {
            hookType: 'beforeGetCollection'
        },
        {
            hookType: 'afterGetCollection',
            expect: [[{ name: 'mock' },{ name: 'mock' }]]
        }
    ]);

    describeTestsForHookError('before', 'get', '/items');
    describeTestsForHookError('after', 'get', '/items');
    describeTestsForHookError('beforeGetCollection', 'get', '/items');
    describeTestsForHookError('afterGetCollection', 'get', '/items');

});