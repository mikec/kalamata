(function() {

    global.MockApp = function() {

        function appMock() {
            this.getHandlers = {};
            this.postHandlers = {};
            this.putHandlers = {};
            this.deleteHandlers = {};
        }

        appMock.prototype.use = function() {};

        appMock.prototype.get = getMockListener('get');

        appMock.prototype.post = getMockListener('post');

        appMock.prototype.put = getMockListener('put');

        appMock.prototype.delete = getMockListener('delete');

        function getMockListener(type) {
            return function(path, fn) {
                this[type + 'Handlers'][path] = fn;
            };
        }

        return new appMock();

    };

    global.MockModel = function(tableName, modelMocks) {

        if(!modelMocks) modelMocks = {};

        var m = function() {};

        m.forge = function() {
            return { tableName: tableName };
        };

        m.prototype.fetchAll = modelMocks.fetchAll || function() {};

        return m;
    };

    global.MockRequest = function() {
        this.query = {};
        this.params = {};
    };

    global.MockResponse = function() {
        this.send = function() {};
    };

    global.MockPromise = function(args) {
        this.args = args;
    };

    MockPromise.prototype.then = function(fn, nextPromise) {
        if(fn) {
            fn.apply(null, this.args);
        }
        return new MockPromise() || nextPromise;
    };

    MockPromise.prototype.catch = function() {

    }

})();