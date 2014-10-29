
global.MockRequest = function(reqMocks) {
    if(!reqMocks) reqMocks = {};
    this.query = reqMocks.query || {};
    this.params = reqMocks.params || {};
};
