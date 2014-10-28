describe('GET request for collection', function() {

    var mockApp, mockResponse, k, w, fetchAllCalled;

    beforeEach(function() {
        mockApp = new MockApp();
        k = require('../index')(mockApp);
    });

    describe('without any query params', function() {

        beforeEach(function() {
            fetchAllCalled = false;
            var mockModel = new MockModel('items', {
                fetchAll: function() {
                    fetchAllCalled = true;
                    return new MockPromise(['foo']);
                }
            });
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
            var mockModel = new MockModel('items', {
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

});