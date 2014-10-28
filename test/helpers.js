(function() {

    console.log = function() { };

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
        m.prototype.where = modelMocks.where || function() {};

        return m;
    };

    global.MockRequest = function(reqMocks) {
        if(!reqMocks) reqMocks = {};
        this.query = reqMocks.query || {};
        this.params = reqMocks.params || {};
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

    global.MockHooks = function(hookTypes) {
        this.hookTypes = hookTypes;
        for(var i in hookTypes) {
            this[hookTypes[i]] = function() {};
        }
    };

    MockHooks.prototype.spyOnAll = function() {
        for(var i in this.hookTypes) {
            spyOn(this, this.hookTypes[i]);
        }
    }

    MockHooks.prototype.setOn = function(chainer) {
        var nxtChainer = chainer;
        for(var i in this.hookTypes) {
            var nxt = nxtChainer[this.hookTypes[i]](this[this.hookTypes[i]]);
            nxtChainer = nxt;
        }
    }

})();