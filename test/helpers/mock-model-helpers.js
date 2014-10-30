
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

        m.prototype.fetchAll = modelMocks.fetchAll || function() {
            return new MockPromise([MockModel.get(tableName)]);
        };
        m.prototype.fetch = modelMocks.fetch || function() {
            return new MockPromise([MockModel.get(tableName)]);
        };
        m.prototype.where = modelMocks.where || function() {
            return MockModel.get(tableName, modelMocks);
        };
        m.prototype.save = modelMocks.save || function() {
            return new MockPromise([MockModel.get(tableName)]);
        };
        m.prototype.destroy = modelMocks.destroy || function() {
            return new MockPromise([MockModel.get(tableName)]);
        };

        return m;
    }

};
