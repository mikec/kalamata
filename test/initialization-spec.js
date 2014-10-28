describe('initialization', function() {

    var appMock, modelMock, k;

    beforeEach(function() {
        appMock = helpers.getAppMock();
        modelMock = helpers.getModelMock('items');
        spyOn(appMock, 'get');
        spyOn(appMock, 'post');
        spyOn(appMock, 'put');
        spyOn(appMock, 'delete');
    })

    describe('with no options', function() {

        beforeEach(function() {
            k = require('../index')(appMock);
            k.expose(modelMock);
        });

        runEndpointConfigTests('/items');

    });

    describe('with an apiRoot option', function() {

        beforeEach(function() {
            k = require('../index')(appMock, { apiRoot: 'api' });
            k.expose(modelMock);
        });

        runEndpointConfigTests('/api/items');

    });

    describe('with an apiRoot option that has more than one path segment',
    function() {

        beforeEach(function() {
            k = require('../index')(appMock, { apiRoot: 'api/v1' });
            k.expose(modelMock);
        });

        runEndpointConfigTests('/api/v1/items');

    });

    describe('with an apiRoot option that has a leading and trailing slash',
    function() {

        beforeEach(function() {
            k = require('../index')(appMock, { apiRoot: '/api/' });
            k.expose(modelMock);
        });

        runEndpointConfigTests('/api/items');

    });

    function runEndpointConfigTests(endpointPath) {

        it('should configure get endpoint for collection', function() {
            expect(appMock.get.calls.argsFor(0)[0]).toEqual(endpointPath);
        });

        it('should configure get endpoint for single item', function() {
            expect(appMock.get.calls.argsFor(1)[0])
                .toEqual(endpointPath + '/:identifier');
        });

        it('should configure post endpoint for collection', function() {
            expect(appMock.post.calls.argsFor(0)[0]).toEqual(endpointPath);
        });

        it('should configure put endpoint for single item', function() {
            expect(appMock.put.calls.argsFor(0)[0])
                .toEqual(endpointPath + '/:identifier');
        });

        it('should configure delete endpoint for single item', function() {
            expect(appMock.delete.calls.argsFor(0)[0])
                .toEqual(endpointPath + '/:identifier');
        });

    }

});