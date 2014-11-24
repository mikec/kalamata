
global.MockRequest = function(reqMocks) {
    if(!reqMocks) reqMocks = {};
    this.query = reqMocks.query || {};
    this.params = reqMocks.params || {};
    this.body = reqMocks.body || undefined;
    this.method = reqMocks.method || undefined;
    this.url = reqMocks.url || undefined;
};
