
global.MockPromise = function(args, nextPromise) {
    this.args = args;
    this.nextPromise = nextPromise;
};

MockPromise.prototype.then = function(fn) {
    if(!this.nextPromise) this.nextPromise = new MockPromise();
    if(fn) {
        try {
            fn.apply(null, this.args);
        } catch(thrownError) {
            this.nextPromise.thrownError = thrownError;
        }
    }
    return this.nextPromise;
};

MockPromise.prototype.catch = function(fn) {
    if(this.thrownError) {
        fn(this.thrownError);
    }
}
