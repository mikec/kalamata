describe('initialization', function() {

    var mockApp, k;

    beforeEach(function() {
        mockApp = new MockApp();
        spyOn(mockApp, 'get');
        spyOn(mockApp, 'post');
        spyOn(mockApp, 'put');
        spyOn(mockApp, 'delete');
    })

    describe('with no options', function() {

        beforeEach(function() {
            k = require('../index')(mockApp);
            k.expose(new MockModel('items'));
        });

        runEndpointConfigTests('/items');

    });

    describe('with an apiRoot option', function() {

        beforeEach(function() {
            k = require('../index')(mockApp, { apiRoot: 'api' });
            k.expose(new MockModel('items'));
        });

        runEndpointConfigTests('/api/items');

    });

    describe('with an apiRoot option that has more than one path segment',
    function() {

        beforeEach(function() {
            k = require('../index')(mockApp, { apiRoot: 'api/v1' });
            k.expose(new MockModel('items'));
        });

        runEndpointConfigTests('/api/v1/items');

    });

    describe('with an apiRoot option that has a leading and trailing slash',
    function() {

        beforeEach(function() {
            k = require('../index')(mockApp, { apiRoot: '/api/' });
            k.expose(new MockModel('items'));
        });

        runEndpointConfigTests('/api/items');

    });

    function runEndpointConfigTests(endpointPath) {

        it('should configure get endpoint for collection', function() {
            expect(mockApp.get.calls.argsFor(0)[0]).toEqual(endpointPath);
        });

        it('should configure get endpoint for single item', function() {
            expect(mockApp.get.calls.argsFor(1)[0])
                .toEqual(endpointPath + '/:identifier');
        });

        it('should configure post endpoint for collection', function() {
            expect(mockApp.post.calls.argsFor(0)[0]).toEqual(endpointPath);
        });

        it('should configure put endpoint for single item', function() {
            expect(mockApp.put.calls.argsFor(0)[0])
                .toEqual(endpointPath + '/:identifier');
        });

        it('should configure delete endpoint for single item', function() {
            expect(mockApp.delete.calls.argsFor(0)[0])
                .toEqual(endpointPath + '/:identifier');
        });

    }

});