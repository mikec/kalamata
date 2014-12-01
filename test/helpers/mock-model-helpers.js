
global.MockModel = {

    get: function(tableName, modelMocks) {

        if(!modelMocks) modelMocks = {};

        var m = function(attributes) {
            m.modelInstances.push(this);
            this.attributes = attributes;
        };

        m.modelInstances = [];

        m.forge = function() {
            return { tableName: tableName };
        };

        m.prototype.fetchAll = modelMocks.fetchAll || function(params) {
            runWithRelatedFuncs(params);
            return new MockPromise([[ this, this, this ]]);
        };
        m.prototype.fetch = modelMocks.fetch || function(params) {
            runWithRelatedFuncs(params);
            return new MockPromise([this]);
        };
        m.prototype.where = modelMocks.where || function() {
            return this;
        };
        m.prototype.load = modelMocks.load || function() {
            return new MockPromise([this]);
        };
        m.prototype.related = modelMocks.related || function() {
            return new MockPromise([ this, this, this ]);
        };
        m.prototype.save = modelMocks.save || function() {
            return new MockPromise([this]);
        };
        m.prototype.destroy = modelMocks.destroy || function() {
            return new MockPromise([this]);
        };
        m.prototype.set = modelMocks.set || function() {
            return this;
        }
        m.prototype.toJSON = modelMocks.toJSON || function() {
            return { name: 'mock toJSON() result' };
        }

        return m;
    }

};

function runWithRelatedFuncs(params) {
    if(params && params.withRelated) {
        for(var i in params.withRelated) {
            var r = params.withRelated[i];
            for(var j in r) {
                r[j]();
            }
        }
    }
}
