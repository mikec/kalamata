
global.MockPromise = function(args) {
    this.args = args;
};

MockPromise.prototype.then = function(fn, nextPromise) {
    if(fn) {
        fn.apply(null, this.args);
    }
    return new MockPromise() || nextPromise;
};

MockPromise.prototype.catch = function() { }
