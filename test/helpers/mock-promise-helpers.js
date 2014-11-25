
global.MockPromise = function(args, nextPromise) {
    this.args = args;
    this.nextPromise = nextPromise;
};

MockPromise.prototype.then = function(fn) {
    if(!this.nextPromise) this.nextPromise = new MockPromise(this.args);
    if(!this.thrownError && fn) {
        try {
            var returnVal = fn.apply(null, this.args);
            if(returnVal) {
                if(returnVal instanceof MockPromise) {
                    this.nextPromise = returnVal;
                } else {
                    this.nextPromise = new MockPromise([returnVal]);
                }
            }
        } catch(thrownError) {
            this.thrownError = thrownError;
            this.nextPromise.thrownError = thrownError;
        }
    } else if(this.thrownError) {
        this.nextPromise.thrownError = this.thrownError;
    }
    return this.nextPromise;
};

MockPromise.prototype.catch = function(nextFn) {
    if(nextFn && this.thrownError) nextFn(this.thrownError);
}

global.MockFailPromise = function(error) {
    this.error = error || new Error('promise failed');
};

MockFailPromise.prototype.then = function() {
    return this;
}

MockFailPromise.prototype.catch = function(nextFn) {
    if(nextFn) nextFn(this.error);
}
