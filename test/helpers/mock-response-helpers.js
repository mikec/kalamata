
global.MockResponse = MockResponse = function() {
    this.headersSent = false;
};

MockResponse.prototype.send = function() {
    this.headersSent = true;
};

