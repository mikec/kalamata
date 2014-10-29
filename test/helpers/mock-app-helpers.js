
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
