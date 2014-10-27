describe('initialization', function() {

    var appMock = {
        use: function() {},
        get: function() {},
        post: function() {},
        put: function() {},
        delete: function() {}
    };

    var modelMock = function() {}
    modelMock.forge = function() {
        return {
            tableName: 'items'
        };
    };

    var k;

    describe('with no options', function() {

        beforeEach(function() {
            spyOn(appMock, 'get');
            spyOn(appMock, 'post');
            spyOn(appMock, 'put');
            spyOn(appMock, 'delete');
            k = require('../index')(appMock);
            k.expose(modelMock);
        });

        it('should configure get endpoint for collection', function() {
            expect(appMock.get.calls.argsFor(0)[0]).toEqual('/items');
        });

        it('should configure get endpoint for single item', function() {
            expect(appMock.get.calls.argsFor(1)[0]).toEqual('/items/:identifier');
        });

        it('should configure post endpoint for collection', function() {
            expect(appMock.post.calls.argsFor(0)[0]).toEqual('/items');
        });

        it('should configure put endpoint for single item', function() {
            expect(appMock.put.calls.argsFor(0)[0]).toEqual('/items/:identifier');
        });

        it('should configure delete endpoint for single item', function() {
            expect(appMock.delete.calls.argsFor(0)[0]).toEqual('/items/:identifier');
        });

    });

});