global.singleResponseHookTest = function(prefix, postfix, endpoint, fn) {

    beforeEach(function() {
        setupHook.call(this, prefix, postfix, endpoint, function(req, res) {
            res.send(true);
        });
    });

    it('should only attempt to send the response once', function() {
        expect(this.mockRes.send.calls.count()).toEqual(1);
        expect(this.mockRes.send.calls.argsFor(0)[0]).toEqual(true);
    });

};

global.hookExecTest = function(prefix, postfix, endpoint) {

    beforeEach(function() {
        setupHook.call(
            this, prefix, postfix, endpoint, function() {});
    });

    it('should pass request and response arguments to the hook',
    function() {
        expect(this.hookFn).toHaveBeenCalled();
        expect(this.hookFn.calls.argsFor(0)[0]).toBe(this.mockReq);
        expect(this.hookFn.calls.argsFor(0)[1]).toBe(this.mockRes);
    });

    it('should not throw and error', function() {
        expect(this.error).toBeUndefined();
    });

};

global.hookErrorTest = function(prefix, postfix, endpoint) {

    beforeEach(function() {
        setupHook.call(
            this, prefix, postfix, endpoint,
            function() {
                throw new Error('mock hook error');
            }
        );
    });

    it('should throw an error', function() {
        expect(this.error).toBeDefined();
        expect(this.error.message).toEqual('mock hook error');
    });

    it('should set the inner error', function() {
        expect(this.error.inner).toBeDefined();
        expect(this.error.inner.message)
            .toEqual(this.hookFnName + ' failed');
    });

}

global.hookPromiseTest = function(prefix, postfix, endpoint) {

    beforeEach(function() {
        var mockPromise = this.mockPromise = new MockPromise();
        spyOn(this.mockPromise, 'then');
        setupHook.call(
            this, prefix, postfix, endpoint,
            function(req, res) {
                return mockPromise;
            }
        );
    });

    it('should execute the promise callback', function() {
        expect(this.mockPromise.then).toHaveBeenCalled()
    });

}

global.setupHook = function(prefix, postfix, endpoint, fn) {
    this.hookFn = fn;
    this.hookFnName = prefix + postfix;
    var mockFetchAllResult =
            this.mockFetchAllResult =
                    [new (MockModel.get('items'))(),
                     new (MockModel.get('items'))(),
                     new (MockModel.get('items'))()];
    var mockFetchResult = this.mockFetchResult = new (MockModel.get('items'))();
    var mockSaveResult = this.mockSaveResult = new (MockModel.get('items'))();
    this.mockFetchAll = function() {
        return new MockPromise([mockFetchAllResult]);
    };
    this.mockFetch = function() {
        return new MockPromise([mockFetchResult]);
    };
    this.mockSave = function() {
        return new MockPromise([mockSaveResult]);
    };
    spyOn(this, 'hookFn').and.callThrough();
    spyOn(this, 'mockFetchAll').and.callThrough();
    spyOn(this, 'mockFetch').and.callThrough();
    spyOn(this, 'mockSave').and.callThrough();
    spyOn(this.mockFetchResult, 'save').and.returnValue(this.mockFetchResult);
    this.mockModel = MockModel.get('items', {
        fetchAll: this.mockFetchAll,
        fetch: this.mockFetch,
        save: this.mockSave
    });
    this.k.expose(this.mockModel);
    this.k[this.hookFnName](this.hookFn);
    this.mockReq = new MockRequest();
    this.mockRes = new MockResponse();
    spyOn(this.mockRes, 'send').and.callThrough();
    try {
        this.mockApp[mockHandlerIndex[postfix]+'Handlers'][endpoint](
            this.mockReq,
            this.mockRes
        );
    } catch(err) {
        this.error = err;
    }
};

var mockHandlerIndex = {
    'GetItems': 'get',
    'GetItem': 'get',
    'CreateItem': 'post',
    'UpdateItem': 'put',
    'DeleteItem': 'delete'
};