(function() {

    var helpers = global.helpers = {

        getModelMock: function(tableName) {
            var m = function() {}
            m.forge = function() {
                return { tableName: tableName };
            };
            return m;
        },

        getAppMock: function() {
            return {
                use: function() {},
                get: function() {},
                post: function() {},
                put: function() {},
                delete: function() {}
            };
        }

    };

})();