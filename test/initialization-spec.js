describe('initialization', function() {

    beforeEach(function() {
        this.mockApp = new MockApp();
        spyOn(this.mockApp, 'get');
        spyOn(this.mockApp, 'post');
        spyOn(this.mockApp, 'put');
        spyOn(this.mockApp, 'delete');
    })

    describe('with no options', function() {

        beforeEach(function() {
            this.k = require('../index')(this.mockApp);
            this.k.expose(new MockModel('items'));
        });

        runEndpointConfigTests('/items');

    });

    describe('with an apiRoot option', function() {

        beforeEach(function() {
            this.k = require('../index')(this.mockApp, { apiRoot: 'api' });
            this.k.expose(new MockModel('items'));
        });

        runEndpointConfigTests('/api/items');

    });

    describe('with an apiRoot option that has more than one path segment',
    function() {

        beforeEach(function() {
            this.k = require('../index')(this.mockApp, { apiRoot: 'api/v1' });
            this.k.expose(new MockModel('items'));
        });

        runEndpointConfigTests('/api/v1/items');

    });

    describe('with an apiRoot option that has a leading and trailing slash',
    function() {

        beforeEach(function() {
            this.k = require('../index')(this.mockApp, { apiRoot: '/api/' });
            this.k.expose(new MockModel('items'));
        });

        runEndpointConfigTests('/api/items');

    });

    function runEndpointConfigTests(endpointPath) {

        it('should configure get endpoint for collection', function() {
            expect(this.mockApp.get.calls.argsFor(0)[0]).toEqual(endpointPath);
        });

        it('should configure get endpoint for single item', function() {
            expect(this.mockApp.get.calls.argsFor(1)[0])
                .toEqual(endpointPath + '/:identifier');
        });

        it('should configure post endpoint for collection', function() {
            expect(this.mockApp.post.calls.argsFor(0)[0]).toEqual(endpointPath);
        });

        it('should configure put endpoint for single item', function() {
            expect(this.mockApp.put.calls.argsFor(0)[0])
                .toEqual(endpointPath + '/:identifier');
        });

        it('should configure delete endpoint for single item', function() {
            expect(this.mockApp.delete.calls.argsFor(0)[0])
                .toEqual(endpointPath + '/:identifier');
        });

    }

});