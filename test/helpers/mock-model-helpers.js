
global.MockModel = function(tableName, modelMocks) {

    if(!modelMocks) modelMocks = {};

    var m = function(attributes) {
        m.modelInstances.push(this);
        this.attributes = attributes;
    };

    m.modelInstances = [];

    m.forge = function() {
        return { tableName: tableName };
    };

    m.prototype.fetchAll = modelMocks.fetchAll || function() {};
    m.prototype.fetch = modelMocks.fetch || function() {};
    m.prototype.where = modelMocks.where || function() {};
    m.prototype.save = modelMocks.save || function() {};

    return m;
};
