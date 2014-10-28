describe('GET request for collection', function() {

    var mockApp, mockResponse, mockRequest, k, w, fetchAllCalled;

    beforeEach(function() {
        mockApp = new MockApp();
        k = require('../index')(mockApp);
    });

    describe('without any query params', function() {

        beforeEach(function() {
            fetchAllCalled = false;
            var mockModel = getMockModel('foo');
            k.expose(mockModel);
            mockResponse = new MockResponse();
            spyOn(mockResponse, 'send');
            mockApp.getHandlers['/items'](new MockRequest(), mockResponse);
        });

        it('should call fetchAll', function() {
            expect(fetchAllCalled).toBeTruthy();
        });

        it('should respond with the result of the fetchAll promise', function() {
            expect(mockResponse.send.calls.argsFor(0)[0]).toEqual('foo');
        });

    });

    describe('with the \'where\' query param', function() {

        describe('set to a valid JSON object', function() {

            beforeEach(function() {
                setupWhereQueryTests('{"firstname":"mike","lastname":"c"}');
            });

            it('should call \'where\' on the model and pass the parsed query value',
            function() {
                expect(w.firstname).toEqual('mike');
                expect(w.lastname).toEqual('c');
            });

        });

        describe('set to a JSON object without quotes around property names',
        function() {

            beforeEach(function() {
                setupWhereQueryTests('{firstname:"mike",lastname:"c"}');
            });

            it('should call \'where\' on the model and pass the parsed query value',
            function() {
                expect(w.firstname).toEqual('mike');
                expect(w.lastname).toEqual('c');
            });

        });

        describe('set to an invalid JSON object', function() {

            beforeEach(function() {
                setupWhereQueryTests('{firstname}');
            });

            it('should send an error response',
            function() {
                expect(mockResponse.send.calls.argsFor(0)[0])
                    .toEqual("Error parsing JSON. '{firstname}' is not valid JSON");
            });

        });

        function setupWhereQueryTests(whereQueryVal) {
            w = null;
            fetchAllCalled = false;
            var mockModel = getMockModelWithQueryParam();
            k.expose(mockModel);
            mockResponse = new MockResponse();
            spyOn(mockResponse, 'send');
            mockApp.getHandlers['/items'](new MockRequest({
                query: {
                    where: whereQueryVal
                }
            }), mockResponse);
        }

    });

    describe('with hooks setup', function() {

        var hooks = {};

        beforeEach(function() {
            fetchAllCalled = false;
            var mockModel = getMockModel('foo');
            hooks = new MockHooks([
                'before',
                'after',
                'beforeGetCollection',
                'afterGetCollection'
            ]);
            hooks.spyOnAll();
            hooks.setOn(k.expose(mockModel));
            mockResponse = new MockResponse();
            mockRequest = new MockRequest();
            spyOn(mockResponse, 'send');
            mockApp.getHandlers['/items'](mockRequest, mockResponse);
        });

        it('should call the before hook with the correct arguments',
        function() {
            expect(hooks.before.calls.argsFor(0)[0]).toEqual(mockRequest);
            expect(hooks.before.calls.argsFor(0)[1]).toEqual(mockResponse);
        });

        it('should call the after hook with the correct arguments',
        function() {
            expect(hooks.after.calls.argsFor(0)[0]).toEqual('foo');
            expect(hooks.after.calls.argsFor(0)[1]).toEqual(mockRequest);
            expect(hooks.after.calls.argsFor(0)[2]).toEqual(mockResponse);
        });

        it('should call the before hook with the correct arguments',
        function() {
            expect(hooks.beforeGetCollection.calls.argsFor(0)[0])
                    .toEqual(mockRequest);
            expect(hooks.beforeGetCollection.calls.argsFor(0)[1])
                    .toEqual(mockResponse);
        });

        it('should call the after hook with the correct arguments',
        function() {
            expect(hooks.afterGetCollection.calls.argsFor(0)[0])
                    .toEqual('foo');
            expect(hooks.afterGetCollection.calls.argsFor(0)[1])
                    .toEqual(mockRequest);
            expect(hooks.afterGetCollection.calls.argsFor(0)[2])
                    .toEqual(mockResponse);
        });

    });

    function getMockModel(collectionVal) {
        var promiseArgs = [];
        promiseArgs.push(collectionVal);
        return new MockModel('items', {
            fetchAll: function() {
                fetchAllCalled = true;
                return new MockPromise(promiseArgs);
            }
        });
    }

    function getMockModelWithQueryParam() {
        return new MockModel('items', {
            where: function(_w) {
                w = _w;
                return {
                    fetchAll: function() {
                        fetchAllCalled = true;
                        return new MockPromise();
                    }
                }
            }
        });
    }

});