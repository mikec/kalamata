
global.MockPromise = function(args, nextPromise) {
    this.args = args;
    this.nextPromise = nextPromise;
};

MockPromise.prototype.then = function(fn) {
    if(!this.nextPromise) this.nextPromise = new MockPromise(this.args);
    if(!this.thrownError && fn) {
        try {
            fn.apply(null, this.args);
        } catch(thrownError) {
            this.thrownError = thrownError;
            this.nextPromise.thrownError = thrownError;
        }
    } else if(this.thrownError) {
        this.nextPromise.thrownError = this.thrownError;
    }
    return this.nextPromise;
};

MockPromise.prototype.catch = function(fn) {
    if(this.thrownError) {
        fn(this.thrownError);
    }
}

global.MockFailPromise = function(error) {
    this.error = error || new Error('promise failed');
};

MockFailPromise.prototype.then = function() {
    var err = this.error;
    return {
        catch: function(fn) {
            fn(err);
        }
    };
}
